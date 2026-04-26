import { beforeEach, describe, expect, it, vi } from 'vitest';

const getSubscriptionEventMetricsMock = vi.fn();
const buildSubscriptionPipelineAlertsMock = vi.fn();
const dispatchSubscriptionPipelineAlertsMock = vi.fn();

vi.mock('@/lib/subscriptionEventMetrics', () => ({
  getSubscriptionEventMetrics: getSubscriptionEventMetricsMock,
}));

vi.mock('@/lib/subscriptionPipelineAlerts', () => ({
  buildSubscriptionPipelineAlerts: buildSubscriptionPipelineAlertsMock,
  dispatchSubscriptionPipelineAlerts: dispatchSubscriptionPipelineAlertsMock,
}));

describe('/api/internal/jobs/subscription-events/alerts route', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.INTERNAL_JOBS_SECRET = 'internal_test_secret';
    getSubscriptionEventMetricsMock.mockResolvedValue({
      provider: 'all',
      metrics: {
        total_events: 10,
        due_now_count: 0,
        dead_lettered_count: 0,
        dead_letter_rate: 0,
        oldest_failed_at: null,
        latest_processed_at: null,
      },
    });
    buildSubscriptionPipelineAlertsMock.mockReturnValue([]);
    dispatchSubscriptionPipelineAlertsMock.mockResolvedValue({
      dispatched: [],
      skippedCooldown: [],
      skippedNoWebhook: [],
      webhookConfigured: false,
    });
  });

  it('returns 401 for missing auth token', async () => {
    const { POST } = await import('./route');
    const req = new Request('http://localhost/api/internal/jobs/subscription-events/alerts', { method: 'POST' });
    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe('unauthorized');
    expect(getSubscriptionEventMetricsMock).not.toHaveBeenCalled();
  });

  it('accepts bearer auth and runs alert evaluation + dispatch', async () => {
    const { POST } = await import('./route');
    const req = new Request('http://localhost/api/internal/jobs/subscription-events/alerts', {
      method: 'POST',
      headers: {
        authorization: 'Bearer internal_test_secret',
      },
      body: JSON.stringify({
        provider: 'stripe',
      }),
    });
    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(getSubscriptionEventMetricsMock).toHaveBeenCalledWith('stripe');
    expect(buildSubscriptionPipelineAlertsMock).toHaveBeenCalledOnce();
    expect(dispatchSubscriptionPipelineAlertsMock).toHaveBeenCalledOnce();
  });

  it('GET route enforces auth contract', async () => {
    const { GET } = await import('./route');
    const unauthorized = new Request('http://localhost/api/internal/jobs/subscription-events/alerts');
    const unauthorizedRes = await GET(unauthorized as never);
    expect(unauthorizedRes.status).toBe(401);

    const authorized = new Request('http://localhost/api/internal/jobs/subscription-events/alerts', {
      headers: { authorization: 'Bearer internal_test_secret' },
    });
    const authorizedRes = await GET(authorized as never);
    const data = await authorizedRes.json();

    expect(authorizedRes.status).toBe(200);
    expect(data.ok).toBe(true);
  });
});
