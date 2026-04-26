import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { syncRevenueCatMembershipByUserIdWithContext } from '@/lib/revenuecat';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const syncResult = await syncRevenueCatMembershipByUserIdWithContext(user.id, {
      source: 'mobile_billing_sync',
    });
    return NextResponse.json({
      ok: true,
      membership_tier: syncResult.isPaid ? 'pro' : 'free',
      subscription_status: syncResult.subscriptionStatus,
      membership_expires_at: syncResult.membershipExpiresAt?.toISOString() || null,
      billing_provider: syncResult.billingProvider,
      subscription_entitlement_id: syncResult.activeEntitlementId,
    });
  } catch (error) {
    console.error('mobile billing sync failed', error);
    return NextResponse.json(
      { error: 'Billing sync failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
