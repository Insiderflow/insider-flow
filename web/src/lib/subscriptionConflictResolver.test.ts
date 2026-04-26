import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = {
  user: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  subscriptionTransitionAudit: {
    create: vi.fn(),
  },
};

vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}));

describe('subscriptionConflictResolver', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    prismaMock.subscriptionTransitionAudit.create.mockResolvedValue({ id: 'audit_1' });
  });

  it('blocks cross-provider downgrade from paid to unpaid', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      membership_tier: 'PAID',
      membership_expires_at: new Date('2026-12-01T00:00:00.000Z'),
      subscription_status: 'active',
      billing_provider: 'stripe',
      subscription_entitlement_id: null,
      subscription_last_synced_at: null,
      stripe_subscription_id: 'sub_123',
    });

    const { resolveAndPersistSubscriptionSnapshot } = await import('./subscriptionConflictResolver');
    const result = await resolveAndPersistSubscriptionSnapshot('user_1', {
      provider: 'apple',
      subscriptionStatus: 'expired',
      membershipExpiresAt: null,
      entitlementId: null,
    });

    expect(result.applied).toBe(false);
    expect(result.reason).toBe('blocked_cross_provider_downgrade');
    expect(prismaMock.user.update).not.toHaveBeenCalled();
    expect(prismaMock.subscriptionTransitionAudit.create).toHaveBeenCalledOnce();
    expect(result.snapshot.subscriptionStatus).toBe('active');
  });

  it('applies incoming paid snapshot when expiry is later', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      membership_tier: 'PAID',
      membership_expires_at: new Date('2026-06-01T00:00:00.000Z'),
      subscription_status: 'active',
      billing_provider: 'stripe',
      subscription_entitlement_id: null,
      subscription_last_synced_at: null,
      stripe_subscription_id: 'sub_123',
    });
    prismaMock.user.update.mockResolvedValue({
      membership_expires_at: new Date('2026-12-01T00:00:00.000Z'),
      subscription_status: 'active',
      billing_provider: 'apple',
      subscription_entitlement_id: 'pro',
    });

    const { resolveAndPersistSubscriptionSnapshot } = await import('./subscriptionConflictResolver');
    const result = await resolveAndPersistSubscriptionSnapshot('user_1', {
      provider: 'apple',
      subscriptionStatus: 'active',
      membershipExpiresAt: new Date('2026-12-01T00:00:00.000Z'),
      entitlementId: 'pro',
    });

    expect(result.applied).toBe(true);
    expect(result.reason).toBe('incoming_later_expiry');
    expect(prismaMock.user.update).toHaveBeenCalledOnce();
    expect(prismaMock.subscriptionTransitionAudit.create).toHaveBeenCalledOnce();
    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user_1' },
        data: expect.objectContaining({
          membership_tier: 'PAID',
          billing_provider: 'apple',
          subscription_status: 'active',
          subscription_entitlement_id: 'pro',
        }),
      }),
    );
  });

  it('allows same-provider downgrade to keep source-of-truth coherent', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      membership_tier: 'PAID',
      membership_expires_at: new Date('2026-06-01T00:00:00.000Z'),
      subscription_status: 'active',
      billing_provider: 'stripe',
      subscription_entitlement_id: null,
      subscription_last_synced_at: null,
      stripe_subscription_id: 'sub_123',
    });
    prismaMock.user.update.mockResolvedValue({
      membership_expires_at: null,
      subscription_status: 'expired',
      billing_provider: 'stripe',
      subscription_entitlement_id: null,
    });

    const { resolveAndPersistSubscriptionSnapshot } = await import('./subscriptionConflictResolver');
    const result = await resolveAndPersistSubscriptionSnapshot('user_1', {
      provider: 'stripe',
      subscriptionStatus: 'expired',
      membershipExpiresAt: null,
      entitlementId: null,
      stripeSubscriptionId: null,
    });

    expect(result.applied).toBe(true);
    expect(result.reason).toBe('same_provider_downgrade');
    expect(prismaMock.user.update).toHaveBeenCalledOnce();
    expect(prismaMock.subscriptionTransitionAudit.create).toHaveBeenCalledOnce();
    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          membership_tier: 'FREE',
          membership_expires_at: null,
          stripe_subscription_id: null,
        }),
      }),
    );
  });
});
