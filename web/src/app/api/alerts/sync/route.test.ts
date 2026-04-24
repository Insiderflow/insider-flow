import { beforeEach, describe, expect, it, vi } from 'vitest';

const runAlertsSyncJobMock = vi.fn();
const getAlertsSyncStateMock = vi.fn();

vi.mock('@/lib/alertsSyncJob', () => ({
  runAlertsSyncJob: runAlertsSyncJobMock,
  getAlertsSyncState: getAlertsSyncStateMock,
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
    expect(runAlertsSyncJobMock).not.toHaveBeenCalled();
  });

  it('returns 202 and skips when a sync is already running', async () => {
    const { POST } = await import('./route');
    runAlertsSyncJobMock.mockResolvedValue({
      skipped: true,
      reason: 'alerts sync already in progress',
    });

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
    expect(runAlertsSyncJobMock).toHaveBeenCalledTimes(1);
  });

  it('runs sync and releases lock on success', async () => {
    const { POST } = await import('./route');
    runAlertsSyncJobMock.mockResolvedValue({ skipped: false });
    getAlertsSyncStateMock.mockReturnValue({
      inProgress: false,
      lastRunAt: '2026-01-01T00:00:00.000Z',
      lastResult: {
        syncedUsers: 5,
        deletedOldReadAlerts: 2,
        elapsedMs: 123,
        retentionCutoff: '2026-01-01T00:00:00.000Z',
      },
      lastError: null,
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
    expect(data.elapsedMs).toBe(123);
    expect(data.lastRunAt).toBe('2026-01-01T00:00:00.000Z');
  });

  it('returns 500 when sync job throws', async () => {
    const { POST } = await import('./route');
    runAlertsSyncJobMock.mockRejectedValue(new Error('sync crashed'));

    const req = new Request('http://localhost/api/alerts/sync', {
      method: 'POST',
      headers: { 'x-alerts-sync-secret': 'alerts-secret' },
    });

    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe('failed');
  });
});
