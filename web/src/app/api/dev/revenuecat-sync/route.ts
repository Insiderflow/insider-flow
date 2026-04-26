import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { syncRevenueCatMembershipByUserIdWithContext } from '@/lib/revenuecat';
import { prisma } from '@/lib/prisma';

type SyncBody = {
  userId?: string;
};

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken) {
    return NextResponse.json({ error: 'admin token not configured' }, { status: 503 });
  }

  if (req.headers.get('x-admin-token') !== adminToken) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const caller = await getSessionUser(req);
  if (!caller) {
    return NextResponse.json({ error: 'login required' }, { status: 401 });
  }

  let body: SyncBody = {};
  try {
    body = (await req.json()) as SyncBody;
  } catch {
    body = {};
  }

  const targetUserId = body.userId || caller.id;
  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, email: true },
  });

  if (!targetUser) {
    return NextResponse.json({ error: 'user not found' }, { status: 404 });
  }

  try {
    const syncResult = await syncRevenueCatMembershipByUserIdWithContext(targetUser.id, {
      source: 'dev_revenuecat_sync',
    });
    return NextResponse.json({
      ok: true,
      user: {
        id: targetUser.id,
        email: targetUser.email,
      },
      membership_tier: syncResult.isPaid ? 'pro' : 'free',
      subscription_status: syncResult.subscriptionStatus,
      membership_expires_at: syncResult.membershipExpiresAt?.toISOString() || null,
      billing_provider: syncResult.billingProvider,
      subscription_entitlement_id: syncResult.activeEntitlementId,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'revenuecat sync failed',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
