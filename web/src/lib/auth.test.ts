import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockPrisma = {
  legacySession: {
    findUnique: vi.fn(),
    deleteMany: vi.fn(),
    create: vi.fn(),
  },
};

vi.mock('./prisma', () => ({
  prisma: mockPrisma,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

vi.mock('@/lib/nextauthOptions', () => ({
  authOptions: {},
}));

vi.mock('./email', () => ({
  sendPasswordResetEmail: vi.fn(),
}));

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

describe('mobile auth token refresh', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.SESSION_SECRET = 'test-session-secret';
    process.env.MOBILE_AUTH_SECRET = 'test-mobile-secret';
  });

  it('rotates refresh token and returns new access token', async () => {
    const nowPlus1Hour = new Date(Date.now() + 60 * 60 * 1000);
    mockPrisma.legacySession.findUnique.mockResolvedValue({
      token: 'old-refresh',
      user_id: 'user_1',
      expires_at: nowPlus1Hour,
      user: { id: 'user_1', email: 'u@example.com' },
    });
    mockPrisma.legacySession.deleteMany.mockResolvedValue({ count: 1 });
    mockPrisma.legacySession.create.mockResolvedValue({});

    const { refreshMobileTokens } = await import('./auth');
    const result = await refreshMobileTokens('old-refresh');

    expect(mockPrisma.legacySession.findUnique).toHaveBeenCalledWith({
      where: { token: 'old-refresh' },
      include: { user: true },
    });
    expect(mockPrisma.legacySession.deleteMany).toHaveBeenCalledWith({
      where: { token: 'old-refresh' },
    });
    expect(result.refreshToken).toHaveLength(64);
    expect(result.accessToken.split('.')).toHaveLength(3);
    expect(result.user.id).toBe('user_1');
  });

  it('throws when refresh token is expired', async () => {
    mockPrisma.legacySession.findUnique.mockResolvedValue({
      token: 'old-refresh',
      user_id: 'user_1',
      expires_at: new Date(Date.now() - 1000),
      user: { id: 'user_1', email: 'u@example.com' },
    });

    const { refreshMobileTokens } = await import('./auth');
    await expect(refreshMobileTokens('old-refresh')).rejects.toThrow('Invalid refresh token');
  });
});
