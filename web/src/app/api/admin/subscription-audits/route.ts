import { NextRequest, NextResponse } from 'next/server';
import { assertAdminRequest } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const auth = assertAdminRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: 401 });
  }

  const userId = request.nextUrl.searchParams.get('userId') || undefined;
  const limitRaw = Number(request.nextUrl.searchParams.get('limit') || 25);
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(limitRaw, 200)) : 25;

  const audits = await prisma.subscriptionTransitionAudit.findMany({
    where: userId ? { user_id: userId } : undefined,
    orderBy: { created_at: 'desc' },
    take: limit,
    select: {
      id: true,
      user_id: true,
      source: true,
      event_key: true,
      event_type: true,
      decision_reason: true,
      applied: true,
      previous_membership_tier: true,
      previous_subscription_status: true,
      previous_billing_provider: true,
      previous_expires_at: true,
      previous_entitlement_id: true,
      incoming_provider: true,
      incoming_subscription_status: true,
      incoming_expires_at: true,
      incoming_entitlement_id: true,
      resulting_membership_tier: true,
      resulting_subscription_status: true,
      resulting_billing_provider: true,
      resulting_expires_at: true,
      resulting_entitlement_id: true,
      created_at: true,
    },
  });

  return NextResponse.json({
    ok: true,
    count: audits.length,
    audits: audits.map((entry) => ({
      ...entry,
      previous_expires_at: entry.previous_expires_at?.toISOString() || null,
      incoming_expires_at: entry.incoming_expires_at?.toISOString() || null,
      resulting_expires_at: entry.resulting_expires_at?.toISOString() || null,
      created_at: entry.created_at.toISOString(),
    })),
  });
}
