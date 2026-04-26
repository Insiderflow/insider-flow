import { beforeEach, describe, expect, it, vi } from 'vitest';

const getSubscriptionEventMetricsMock = vi.fn();
const buildSubscriptionPipelineAlertsMock = vi.fn();
const buildSubscriptionPipelineTestAlertMock = vi.fn();
const dispatchSubscriptionPipelineAlertsMock = vi.fn();

vi.mock('@/lib/subscriptionEventMetrics', () => ({
  getSubscriptionEventMetrics: getSubscriptionEventMetricsMock,
}));

vi.mock('@/lib/subscriptionPipelineAlerts', () => ({
  buildSubscriptionPipelineAlerts: buildSubscriptionPipelineAlertsMock,
  buildSubscriptionPipelineTestAlert: buildSubscriptionPipelineTestAlertMock,
  dispatchSubscriptionPipelineAlerts: dispatchSubscriptionPipelineAlertsMock,
}));

describe('/api/admin/jobs/subscription-events/alerts route', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.ADMIN_TOKEN = 'admin_test_token';
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
    buildSubscriptionPipelineTestAlertMock.mockReturnValue({
      key: 'subscription_test_alert',
      severity: 'info',
      metric: 'test',
      message: 'test',
      threshold: 1,
      actual: 1,
    });
    dispatchSubscriptionPipelineAlertsMock.mockResolvedValue({
      dispatched: [],
      skippedCooldown: [],
      skippedNoWebhook: [],
      webhookConfigured: true,
    });
  });

  it('returns unauthorized without admin token', async () => {
    const { GET } = await import('./route');
    const req = {
      headers: new Headers(),
      nextUrl: new URL('http://localhost/api/admin/jobs/subscription-events/alerts'),
    };
    const res = await GET(req as never);
    expect(res.status).toBe(401);
  });

  it('supports test mode and forces dispatch', async () => {
    const { POST } = await import('./route');
    const req = new Request('http://localhost/api/admin/jobs/subscription-events/alerts', {
      method: 'POST',
      headers: {
        'x-admin-token': 'admin_test_token',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ test: true, notify: true }),
    });

    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.mode).toBe('test');
    expect(buildSubscriptionPipelineTestAlertMock).toHaveBeenCalledOnce();
    expect(dispatchSubscriptionPipelineAlertsMock).toHaveBeenCalledWith(
      expect.any(Array),
      { force: true },
    );
  });
});
