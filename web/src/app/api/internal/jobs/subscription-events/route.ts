import { NextRequest, NextResponse } from 'next/server';
import { assertInternalJobRequest } from '@/lib/admin';
import { replaySubscriptionEvents } from '@/lib/subscriptionEventReplay';

function parseProvider(value: unknown): 'stripe' | 'revenuecat' | undefined {
  if (value === 'stripe' || value === 'revenuecat') return value;
  return undefined;
}

export async function POST(request: NextRequest) {
  const auth = assertInternalJobRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: 401 });
  }

  let body: { provider?: 'stripe' | 'revenuecat'; limit?: number } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }

  const provider = parseProvider(body.provider);
  const limit = Number.isFinite(Number(body.limit))
    ? Math.max(1, Math.min(Number(body.limit), 50))
    : 20;

  try {
    const replayResult = await replaySubscriptionEvents({
      provider,
      limit,
      eligibleOnly: true,
    });
    return NextResponse.json({
      ok: true,
      mode: 'auto',
      provider: provider || 'all',
      ...replayResult,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'internal subscription auto-retry failed',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  const auth = assertInternalJobRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    message: 'internal subscription events job endpoint is active',
  });
}
