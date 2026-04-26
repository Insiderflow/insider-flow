import { describe, expect, it } from 'vitest';
import {
  deriveStripeSubscriptionStatus,
  isPaidSubscriptionStatus,
  normalizeStoredSubscriptionStatus,
} from '@/lib/subscriptionStateMachine';

describe('subscriptionStateMachine', () => {
  it('maps Stripe statuses to normalized paid/unpaid states', () => {
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const past = new Date(Date.now() - 24 * 60 * 60 * 1000);

    expect(deriveStripeSubscriptionStatus({ stripeStatus: 'active', currentPeriodEnd: future }).subscriptionStatus).toBe('active');
    expect(deriveStripeSubscriptionStatus({ stripeStatus: 'trialing', currentPeriodEnd: future }).subscriptionStatus).toBe('trialing');
    expect(deriveStripeSubscriptionStatus({ stripeStatus: 'past_due', currentPeriodEnd: future }).subscriptionStatus).toBe('grace_period');
    expect(deriveStripeSubscriptionStatus({ stripeStatus: 'canceled', currentPeriodEnd: future }).subscriptionStatus).toBe('grace_period');
    expect(deriveStripeSubscriptionStatus({ stripeStatus: 'canceled', currentPeriodEnd: past }).subscriptionStatus).toBe('expired');
    expect(deriveStripeSubscriptionStatus({ stripeStatus: 'incomplete_expired', currentPeriodEnd: future }).subscriptionStatus).toBe('expired');
    expect(deriveStripeSubscriptionStatus({ stripeStatus: 'unknown_status', currentPeriodEnd: null }).subscriptionStatus).toBe('free');
  });

  it('keeps paid-status truth table strict', () => {
    expect(isPaidSubscriptionStatus('active')).toBe(true);
    expect(isPaidSubscriptionStatus('trialing')).toBe(true);
    expect(isPaidSubscriptionStatus('grace_period')).toBe(true);
    expect(isPaidSubscriptionStatus('free')).toBe(false);
    expect(isPaidSubscriptionStatus('expired')).toBe(false);
    expect(isPaidSubscriptionStatus('canceled')).toBe(false);
  });

  it('normalizes unknown stored statuses from membership tier fallback', () => {
    expect(normalizeStoredSubscriptionStatus('ACTIVE', 'FREE')).toBe('active');
    expect(normalizeStoredSubscriptionStatus('not_a_real_status', 'PAID')).toBe('active');
    expect(normalizeStoredSubscriptionStatus(undefined, 'FREE')).toBe('free');
  });
});
