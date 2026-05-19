import type { User } from '@prisma/client';
import { getNormalizedSubscription } from '@/lib/subscriptionSnapshot';
import { isPaidSubscriptionStatus } from '@/lib/subscriptionStateMachine';

const PAID_TIERS = new Set(['PAID', 'PRO', 'PREMIUM']);

function membershipNotExpired(expiresAt: Date | null | undefined): boolean {
  if (!expiresAt) return true;
  return expiresAt.getTime() > Date.now();
}

/** Matches mobile `isPaidUser` — tier PAID counts even when subscription_status is stale `free`. */
export function hasMobilePremiumAccess(user: User): boolean {
  const subscription = getNormalizedSubscription(user);
  if (isPaidSubscriptionStatus(subscription.subscriptionStatus)) {
    return membershipNotExpired(user.membership_expires_at);
  }

  const tier = (user.membership_tier || '').toUpperCase();
  if (PAID_TIERS.has(tier)) {
    return membershipNotExpired(user.membership_expires_at);
  }

  return false;
}
