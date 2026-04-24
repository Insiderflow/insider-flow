import { beforeEach, describe, expect, it, vi } from 'vitest';

const refreshMobileTokensMock = vi.fn();

vi.mock('@/lib/auth', () => ({
  refreshMobileTokens: refreshMobileTokensMock,
}));

describe('POST /api/mobile/auth/refresh', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('returns 400 when refresh token is missing', async () => {
    const { POST } = await import('./route');
    const req = new Request('http://localhost/api/mobile/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'content-type': 'application/json' },
    });

    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('Refresh token is required');
    expect(refreshMobileTokensMock).not.toHaveBeenCalled();
  });

  it('returns rotated tokens and user payload on success', async () => {
    const { POST } = await import('./route');
    refreshMobileTokensMock.mockResolvedValue({
      accessToken: 'access.jwt.token',
      refreshToken: 'new-refresh-token',
      user: {
        id: 'user_1',
        email: 'user@example.com',
        email_verified: true,
      },
    });

    const req = new Request('http://localhost/api/mobile/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: 'old-refresh-token' }),
      headers: { 'content-type': 'application/json' },
    });

    const res = await POST(req as never);
    const data = await res.json();

    expect(refreshMobileTokensMock).toHaveBeenCalledWith('old-refresh-token');
    expect(res.status).toBe(200);
    expect(data).toEqual({
      accessToken: 'access.jwt.token',
      refreshToken: 'new-refresh-token',
      user: {
        id: 'user_1',
        email: 'user@example.com',
        emailVerified: true,
      },
    });
  });

  it('returns 401 when refresh service throws auth error', async () => {
    const { POST } = await import('./route');
    refreshMobileTokensMock.mockRejectedValue(new Error('Invalid refresh token'));

    const req = new Request('http://localhost/api/mobile/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: 'bad-token' }),
      headers: { 'content-type': 'application/json' },
    });

    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe('Invalid refresh token');
  });
});
