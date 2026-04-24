import { beforeEach, describe, expect, it, vi } from 'vitest';

const getSessionUserMock = vi.fn();
const isAdminUserEmailMock = vi.fn();
const getAlertsSyncStateMock = vi.fn();
const runAlertsSyncJobMock = vi.fn();

vi.mock('@/lib/auth', () => ({
  getSessionUser: getSessionUserMock,
}));

vi.mock('@/lib/adminUsers', () => ({
  isAdminUserEmail: isAdminUserEmailMock,
}));

vi.mock('@/lib/alertsSyncJob', () => ({
  getAlertsSyncState: getAlertsSyncStateMock,
  runAlertsSyncJob: runAlertsSyncJobMock,
}));

describe('/api/account/alerts-sync', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('GET returns 401 when not logged in', async () => {
    const { GET } = await import('./route');
    getSessionUserMock.mockResolvedValue(null);

    const req = new Request('http://localhost/api/account/alerts-sync');
    const res = await GET(req as never);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('GET returns 403 when user is not admin', async () => {
    const { GET } = await import('./route');
    getSessionUserMock.mockResolvedValue({ id: 'u1', email: 'user@example.com' });
    isAdminUserEmailMock.mockReturnValue(false);

    const req = new Request('http://localhost/api/account/alerts-sync');
    const res = await GET(req as never);
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toBe('Forbidden');
  });

  it('GET returns sync state for admin', async () => {
    const { GET } = await import('./route');
    getSessionUserMock.mockResolvedValue({ id: 'u1', email: 'admin@example.com' });
    isAdminUserEmailMock.mockReturnValue(true);
    getAlertsSyncStateMock.mockReturnValue({
      inProgress: false,
      lastRunAt: '2026-01-01T00:00:00.000Z',
      lastResult: null,
      lastError: null,
    });

    const req = new Request('http://localhost/api/account/alerts-sync');
    const res = await GET(req as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.lastRunAt).toBe('2026-01-01T00:00:00.000Z');
  });

  it('POST returns 202 when sync already in progress', async () => {
    const { POST } = await import('./route');
    getSessionUserMock.mockResolvedValue({ id: 'u1', email: 'admin@example.com' });
    isAdminUserEmailMock.mockReturnValue(true);
    runAlertsSyncJobMock.mockResolvedValue({
      skipped: true,
      reason: 'alerts sync already in progress',
    });
    getAlertsSyncStateMock.mockReturnValue({
      inProgress: true,
      lastRunAt: null,
      lastResult: null,
      lastError: null,
    });

    const req = new Request('http://localhost/api/account/alerts-sync', { method: 'POST' });
    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(202);
    expect(data.skipped).toBe(true);
    expect(data.reason).toBe('alerts sync already in progress');
  });
});
