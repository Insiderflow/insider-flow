import { type NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getNormalizedSubscription } from '@/lib/subscriptionSnapshot';

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscription = getNormalizedSubscription(user);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.name || user.email.split('@')[0],
        role: 'user',
        membership_tier: subscription.membershipTier,
        membership_expires_at: subscription.membershipExpiresAt,
        subscription_status: subscription.subscriptionStatus,
        billing_provider: subscription.billingProvider,
        subscription_entitlement_id: subscription.entitlementId,
        subscription_last_synced_at: subscription.lastSyncedAt,
        created_date: user.created_at.toISOString(),
      },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}
