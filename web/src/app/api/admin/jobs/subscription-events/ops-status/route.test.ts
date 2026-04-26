import { beforeEach, describe, expect, it, vi } from 'vitest';

const getSubscriptionEventMetricsMock = vi.fn();
const prismaMock = {
  opsAlertNotification: {
    findMany: vi.fn(),
  },
};

vi.mock('@/lib/subscriptionEventMetrics', () => ({
  getSubscriptionEventMetrics: getSubscriptionEventMetricsMock,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}));

describe('/api/admin/jobs/subscription-events/ops-status route', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.ADMIN_TOKEN = 'admin_test_token';
    process.env.SUBSCRIPTION_OPS_STALE_MINUTES_WARN = '30';
    getSubscriptionEventMetricsMock.mockResolvedValue({
      provider: 'all',
      metrics: {
        latest_processed_at: '2026-04-26T20:00:00.000Z',
      },
    });
    prismaMock.opsAlertNotification.findMany.mockResolvedValue([
      {
        alert_key: 'subscription_dead_letter_rate',
        severity: 'critical',
        last_sent_at: new Date('2026-04-26T20:05:00.000Z'),
        send_count: 2,
        updated_at: new Date('2026-04-26T20:05:01.000Z'),
      },
    ]);
  });

  it('requires admin auth', async () => {
    const { GET } = await import('./route');
    const req = {
      headers: new Headers(),
      nextUrl: new URL('http://localhost/api/admin/jobs/subscription-events/ops-status'),
    };
    const res = await GET(req as never);
    expect(res.status).toBe(401);
  });

  it('returns ops status summary and notification history', async () => {
    const { GET } = await import('./route');
    const req = {
      headers: new Headers({ 'x-admin-token': 'admin_test_token' }),
      nextUrl: new URL('http://localhost/api/admin/jobs/subscription-events/ops-status?limit=5'),
    };

    const res = await GET(req as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.ops_status.latest_processed_at).toBe('2026-04-26T20:00:00.000Z');
    expect(data.notifications[0].alert_key).toBe('subscription_dead_letter_rate');
    expect(prismaMock.opsAlertNotification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 5 }),
    );
  });
});
