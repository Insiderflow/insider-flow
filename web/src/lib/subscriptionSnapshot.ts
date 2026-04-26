import {
  isPaidSubscriptionStatus,
  normalizeStoredSubscriptionStatus,
} from '@/lib/subscriptionStateMachine';

type DbUserSubscriptionShape = {
  membership_tier: 'FREE' | 'PAID';
  membership_expires_at: Date | null;
  subscription_status: string | null;
  billing_provider: string | null;
  subscription_entitlement_id: string | null;
  subscription_last_synced_at: Date | null;
  stripe_subscription_id: string | null;
};

export function getNormalizedSubscription(user: DbUserSubscriptionShape) {
  const subscriptionStatus = normalizeStoredSubscriptionStatus(
    user.subscription_status,
    user.membership_tier,
  );
  const isPaid = isPaidSubscriptionStatus(subscriptionStatus);

  const billingProvider = user.billing_provider
    ? user.billing_provider.toLowerCase()
    : user.stripe_subscription_id
      ? 'stripe'
      : null;

  return {
    membershipTier: isPaid ? 'pro' : 'free',
    subscriptionStatus,
    billingProvider,
    membershipExpiresAt: user.membership_expires_at ? user.membership_expires_at.toISOString() : null,
    entitlementId: user.subscription_entitlement_id || null,
    lastSyncedAt: user.subscription_last_synced_at
      ? user.subscription_last_synced_at.toISOString()
      : null,
  };
}
