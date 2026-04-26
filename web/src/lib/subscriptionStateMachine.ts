export type NormalizedSubscriptionStatus =
  | 'free'
  | 'active'
  | 'trialing'
  | 'grace_period'
  | 'expired'
  | 'canceled';

const KNOWN_STATUSES = new Set<NormalizedSubscriptionStatus>([
  'free',
  'active',
  'trialing',
  'grace_period',
  'expired',
  'canceled',
]);

export const PAID_SUBSCRIPTION_STATUSES = new Set<NormalizedSubscriptionStatus>([
  'active',
  'trialing',
  'grace_period',
]);

export function isPaidSubscriptionStatus(status: NormalizedSubscriptionStatus) {
  return PAID_SUBSCRIPTION_STATUSES.has(status);
}

export function normalizeStoredSubscriptionStatus(
  status: string | null | undefined,
  membershipTier: 'FREE' | 'PAID',
): NormalizedSubscriptionStatus {
  const normalized = (status || '').toLowerCase() as NormalizedSubscriptionStatus;
  if (KNOWN_STATUSES.has(normalized)) return normalized;
  return membershipTier === 'PAID' ? 'active' : 'free';
}

export function deriveStripeSubscriptionStatus({
  stripeStatus,
  currentPeriodEnd,
}: {
  stripeStatus?: string | null;
  currentPeriodEnd?: Date | null;
}): {
  subscriptionStatus: NormalizedSubscriptionStatus;
  isPaid: boolean;
  membershipExpiresAt: Date | null;
} {
  const status = (stripeStatus || '').toLowerCase();
  const now = Date.now();
  const hasFutureAccess = currentPeriodEnd ? currentPeriodEnd.getTime() > now : false;

  let subscriptionStatus: NormalizedSubscriptionStatus;
  if (status === 'trialing') subscriptionStatus = 'trialing';
  else if (status === 'active') subscriptionStatus = 'active';
  else if (status === 'past_due' || status === 'unpaid') subscriptionStatus = 'grace_period';
  else if (status === 'canceled') subscriptionStatus = hasFutureAccess ? 'grace_period' : 'expired';
  else if (status === 'incomplete' || status === 'incomplete_expired') subscriptionStatus = 'expired';
  else subscriptionStatus = hasFutureAccess ? 'grace_period' : 'free';

  return {
    subscriptionStatus,
    isPaid: isPaidSubscriptionStatus(subscriptionStatus),
    membershipExpiresAt: currentPeriodEnd || null,
  };
}
