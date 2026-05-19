import { describe, expect, it } from 'vitest';
import { hasMobilePremiumAccess } from './premiumAccess';

describe('hasMobilePremiumAccess', () => {
  const base = {
    membership_expires_at: null,
    membership_tier: 'FREE' as const,
    subscription_status: 'free',
    billing_provider: null,
    subscription_entitlement_id: null,
    subscription_last_synced_at: null,
    stripe_subscription_id: null,
  };

  it('accepts PAID tier when subscription_status is stale free', () => {
    expect(
      hasMobilePremiumAccess({
        ...base,
        id: '1',
        email: 'a@b.com',
        membership_tier: 'PAID',
        subscription_status: 'free',
      } as never),
    ).toBe(true);
  });

  it('accepts active subscription status', () => {
    expect(
      hasMobilePremiumAccess({
        ...base,
        id: '1',
        email: 'a@b.com',
        membership_tier: 'FREE',
        subscription_status: 'active',
      } as never),
    ).toBe(true);
  });

  it('rejects expired membership', () => {
    expect(
      hasMobilePremiumAccess({
        ...base,
        id: '1',
        email: 'a@b.com',
        membership_tier: 'PAID',
        subscription_status: 'free',
        membership_expires_at: new Date('2020-01-01'),
      } as never),
    ).toBe(false);
  });
});
