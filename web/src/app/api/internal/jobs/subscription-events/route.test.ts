import { beforeEach, describe, expect, it, vi } from 'vitest';

const replaySubscriptionEventsMock = vi.fn();

vi.mock('@/lib/subscriptionEventReplay', () => ({
  replaySubscriptionEvents: replaySubscriptionEventsMock,
}));

describe('/api/internal/jobs/subscription-events route', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.INTERNAL_JOBS_SECRET = 'internal_test_secret';
    replaySubscriptionEventsMock.mockResolvedValue({
      replayed: [],
      errors: [],
      requested: 0,
      eligibleOnly: true,
    });
  });

  it('returns 401 for missing auth token', async () => {
    const { POST } = await import('./route');
    const req = new Request('http://localhost/api/internal/jobs/subscription-events', { method: 'POST' });
    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe('unauthorized');
    expect(replaySubscriptionEventsMock).not.toHaveBeenCalled();
  });

  it('accepts bearer auth and forces eligibleOnly contract', async () => {
    const { POST } = await import('./route');
    const req = new Request('http://localhost/api/internal/jobs/subscription-events', {
      method: 'POST',
      headers: {
        authorization: 'Bearer internal_test_secret',
      },
      body: JSON.stringify({
        provider: 'revenuecat',
        limit: 200,
      }),
    });
    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(replaySubscriptionEventsMock).toHaveBeenCalledWith({
      provider: 'revenuecat',
      limit: 50,
      eligibleOnly: true,
    });
  });

  it('accepts x-internal-job-token and defaults limit/provider safely', async () => {
    const { POST } = await import('./route');
    const req = new Request('http://localhost/api/internal/jobs/subscription-events', {
      method: 'POST',
      headers: {
        'x-internal-job-token': 'internal_test_secret',
      },
      body: JSON.stringify({
        provider: 'not-real-provider',
      }),
    });
    const res = await POST(req as never);

    expect(res.status).toBe(200);
    expect(replaySubscriptionEventsMock).toHaveBeenCalledWith({
      provider: undefined,
      limit: 20,
      eligibleOnly: true,
    });
  });

  it('ignores unsupported status overrides and still enforces eligible-only failed flow', async () => {
    const { POST } = await import('./route');
    const req = new Request('http://localhost/api/internal/jobs/subscription-events', {
      method: 'POST',
      headers: {
        authorization: 'Bearer internal_test_secret',
      },
      body: JSON.stringify({
        provider: 'stripe',
        status: 'dead_lettered',
        limit: 5,
      }),
    });
    const res = await POST(req as never);

    expect(res.status).toBe(200);
    expect(replaySubscriptionEventsMock).toHaveBeenCalledWith({
      provider: 'stripe',
      limit: 5,
      eligibleOnly: true,
    });
  });

  it('GET route enforces auth contract', async () => {
    const { GET } = await import('./route');
    const unauthorized = new Request('http://localhost/api/internal/jobs/subscription-events');
    const unauthorizedRes = await GET(unauthorized as never);
    expect(unauthorizedRes.status).toBe(401);

    const authorized = new Request('http://localhost/api/internal/jobs/subscription-events', {
      headers: { authorization: 'Bearer internal_test_secret' },
    });
    const authorizedRes = await GET(authorized as never);
    const data = await authorizedRes.json();

    expect(authorizedRes.status).toBe(200);
    expect(data.ok).toBe(true);
  });
});
