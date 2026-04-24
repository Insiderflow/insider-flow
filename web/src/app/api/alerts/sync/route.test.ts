import { beforeEach, describe, expect, it, vi } from 'vitest';

const syncAllUserAlertsMock = vi.fn();
const pruneOldReadAlertsMock = vi.fn();
const tryAcquireAlertsSyncLockMock = vi.fn();
const releaseAlertsSyncLockMock = vi.fn();

vi.mock('@/lib/alerts', () => ({
  syncAllUserAlerts: syncAllUserAlertsMock,
  pruneOldReadAlerts: pruneOldReadAlertsMock,
}));

vi.mock('@/lib/alertsSyncLock', () => ({
  tryAcquireAlertsSyncLock: tryAcquireAlertsSyncLockMock,
  releaseAlertsSyncLock: releaseAlertsSyncLockMock,
}));

describe('POST /api/alerts/sync', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.ALERTS_SYNC_SECRET = 'alerts-secret';
  });

  it('returns 401 when secret header is missing/invalid', async () => {
    const { POST } = await import('./route');
    const req = new Request('http://localhost/api/alerts/sync', { method: 'POST' });

    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
    expect(tryAcquireAlertsSyncLockMock).not.toHaveBeenCalled();
  });

  it('returns 202 and skips when a sync is already running', async () => {
    const { POST } = await import('./route');
    tryAcquireAlertsSyncLockMock.mockResolvedValue(false);

    const req = new Request('http://localhost/api/alerts/sync', {
      method: 'POST',
      headers: { 'x-alerts-sync-secret': 'alerts-secret' },
    });

    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(202);
    expect(data).toEqual({
      ok: true,
      skipped: true,
      reason: 'alerts sync already in progress',
    });
    expect(syncAllUserAlertsMock).not.toHaveBeenCalled();
    expect(pruneOldReadAlertsMock).not.toHaveBeenCalled();
    expect(releaseAlertsSyncLockMock).not.toHaveBeenCalled();
  });

  it('runs sync and releases lock on success', async () => {
    const { POST } = await import('./route');
    tryAcquireAlertsSyncLockMock.mockResolvedValue(true);
    syncAllUserAlertsMock.mockResolvedValue({ syncedUsers: 5 });
    pruneOldReadAlertsMock.mockResolvedValue({
      deletedAlerts: 2,
      cutoff: new Date('2026-01-01T00:00:00.000Z'),
    });

    const req = new Request('http://localhost/api/alerts/sync', {
      method: 'POST',
      headers: { 'x-alerts-sync-secret': 'alerts-secret' },
    });

    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.syncedUsers).toBe(5);
    expect(data.deletedOldReadAlerts).toBe(2);
    expect(data.retentionCutoff).toBe('2026-01-01T00:00:00.000Z');
    expect(releaseAlertsSyncLockMock).toHaveBeenCalledTimes(1);
  });

  it('returns 500 and still releases lock on failure', async () => {
    const { POST } = await import('./route');
    tryAcquireAlertsSyncLockMock.mockResolvedValue(true);
    syncAllUserAlertsMock.mockRejectedValue(new Error('sync crashed'));

    const req = new Request('http://localhost/api/alerts/sync', {
      method: 'POST',
      headers: { 'x-alerts-sync-secret': 'alerts-secret' },
    });

    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe('failed');
    expect(releaseAlertsSyncLockMock).toHaveBeenCalledTimes(1);
  });
});
