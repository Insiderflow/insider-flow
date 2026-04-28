import { describe, expect, it } from 'vitest';
import { mapUserProfile, mapWatchlistItem } from './mappers';

describe('mapUserProfile', () => {
  it('normalizes unsupported subscription status/provider to safe defaults', () => {
    const mapped = mapUserProfile({
      id: 'u_1',
      email: 'test@example.com',
      full_name: 'Tester',
      role: 'admin',
      membership_tier: 'enterprise',
      subscription_status: 'mystery_status',
      billing_provider: 'paypal',
      created_date: '2026-04-01T10:00:00Z',
    });

    expect(mapped.subscription_status).toBe('free');
    expect(mapped.billing_provider).toBeNull();
    expect(mapped.membership_tier).toBe('free');
    expect(mapped.role).toBe('admin');
  });
});

describe('mapWatchlistItem', () => {
  it('maps legacy stock type to ticker and resolves identifier', () => {
    const mapped = mapWatchlistItem({
      id: 'w_1',
      watchlist_type: 'stock',
      ticker: 'nvda',
      created_at: '2026-04-02T02:30:00Z',
    });

    expect(mapped.type).toBe('ticker');
    expect(mapped.identifier).toBe('nvda');
    expect(mapped.label).toBe('nvda');
    expect(mapped.created_date).toBe('2026-04-02');
  });
});
