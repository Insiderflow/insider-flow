import { beforeEach, describe, expect, it, vi } from 'vitest';

const getSessionUserMock = vi.fn();

vi.mock('@/lib/auth', () => ({
  getSessionUser: getSessionUserMock,
}));

describe('GET /api/mobile/auth/me', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('returns 401 when session user is missing', async () => {
    const { GET } = await import('./route');
    getSessionUserMock.mockResolvedValue(null);

    const req = new Request('http://localhost/api/mobile/auth/me');
    const res = await GET(req as never);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns mapped mobile profile when user exists', async () => {
    const { GET } = await import('./route');
    const createdAt = new Date('2026-01-01T00:00:00.000Z');
    const expiresAt = new Date('2026-12-01T00:00:00.000Z');
    getSessionUserMock.mockResolvedValue({
      id: 'user_1',
      email: 'user@example.com',
      name: null,
      membership_tier: 'PAID',
      membership_expires_at: expiresAt,
      stripe_subscription_id: 'sub_123',
      created_at: createdAt,
    });

    const req = new Request('http://localhost/api/mobile/auth/me');
    const res = await GET(req as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual({
      user: {
        id: 'user_1',
        email: 'user@example.com',
        full_name: 'user',
        role: 'user',
        membership_tier: 'pro',
        membership_expires_at: '2026-12-01T00:00:00.000Z',
        subscription_status: 'active',
        billing_provider: 'stripe',
        created_date: '2026-01-01T00:00:00.000Z',
      },
    });
  });

  it('returns 500 when auth lookup throws', async () => {
    const { GET } = await import('./route');
    getSessionUserMock.mockRejectedValue(new Error('db unavailable'));

    const req = new Request('http://localhost/api/mobile/auth/me');
    const res = await GET(req as never);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe('Failed to fetch user');
  });
});
