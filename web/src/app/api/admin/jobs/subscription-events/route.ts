import { NextRequest, NextResponse } from 'next/server';
import { assertAdminRequest } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { replaySubscriptionEvents } from '@/lib/subscriptionEventReplay';
import { enforceRouteRateLimit } from '@/lib/rateLimit';

function parseProvider(value: unknown): 'stripe' | 'revenuecat' | undefined {
  if (value === 'stripe' || value === 'revenuecat') return value;
  return undefined;
}

function parseStatusFilter(value: unknown): 'failed' | 'dead_lettered' | 'all' {
  if (value === 'dead_lettered') return 'dead_lettered';
  if (value === 'all') return 'all';
  return 'failed';
}

export async function GET(request: NextRequest) {
  const rate = enforceRouteRateLimit(request, 'admin_sub_events', 60, 60_000);
  if (!rate.ok) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  const auth = assertAdminRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: 401 });
  }

  const provider = parseProvider(request.nextUrl.searchParams.get('provider'));
  const status = parseStatusFilter(request.nextUrl.searchParams.get('status'));
  const limitParam = Number(request.nextUrl.searchParams.get('limit') || 20);
  const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(limitParam, 100)) : 20;

  const failedEvents = await prisma.subscriptionEvent.findMany({
    where: {
      ...(status === 'all' ? { status: { in: ['failed', 'dead_lettered'] } } : { status }),
      ...(provider ? { provider } : {}),
    },
    orderBy: { created_at: 'desc' },
    take: limit,
    select: {
      id: true,
      provider: true,
      event_key: true,
      event_type: true,
      status: true,
      retry_count: true,
      next_retry_at: true,
      error: true,
      created_at: true,
      updated_at: true,
    },
  });

  const counts = await prisma.subscriptionEvent.groupBy({
    by: ['status'],
    _count: { _all: true },
    where: provider ? { provider } : undefined,
  });

  const oldestDeadLetter = await prisma.subscriptionEvent.findFirst({
    where: {
      status: 'dead_lettered',
      ...(provider ? { provider } : {}),
    },
    orderBy: { created_at: 'asc' },
    select: { created_at: true },
  });

  return NextResponse.json({
    ok: true,
    provider: provider || 'all',
    status,
    failed: failedEvents,
    counts: counts.reduce<Record<string, number>>((acc, item) => {
      acc[item.status] = item._count._all;
      return acc;
    }, {}),
    dead_letter_summary: {
      count: counts.find((item) => item.status === 'dead_lettered')?._count._all || 0,
      oldest_created_at: oldestDeadLetter?.created_at?.toISOString() || null,
    },
  });
}

export async function POST(request: NextRequest) {
  const rate = enforceRouteRateLimit(request, 'admin_sub_events', 60, 60_000);
  if (!rate.ok) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  const auth = assertAdminRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: 401 });
  }

  let body: {
    eventId?: string;
    provider?: 'stripe' | 'revenuecat';
    limit?: number;
    mode?: 'manual' | 'auto';
    status?: 'failed' | 'dead_lettered' | 'all';
  } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }

  const provider = parseProvider(body.provider);
  const limit = Number.isFinite(Number(body.limit))
    ? Math.max(1, Math.min(Number(body.limit), 50))
    : 10;
  const mode = body.mode === 'auto' ? 'auto' : 'manual';
  const status = parseStatusFilter(body.status);
  const statuses: Array<'failed' | 'dead_lettered'> =
    status === 'all'
      ? ['failed', 'dead_lettered']
      : [status];
  if (mode === 'auto' && status === 'dead_lettered') {
    return NextResponse.json(
      {
        error: 'auto mode cannot replay dead lettered events',
      },
      { status: 400 },
    );
  }

  try {
    const replayResult = await replaySubscriptionEvents({
      eventId: body.eventId,
      provider,
      limit,
      eligibleOnly: mode === 'auto',
      statuses: mode === 'auto' ? ['failed'] : statuses,
    });
    return NextResponse.json({
      ok: true,
      mode,
      status,
      ...replayResult,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'subscription event replay failed',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
