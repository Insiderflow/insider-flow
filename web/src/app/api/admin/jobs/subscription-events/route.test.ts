import { beforeEach, describe, expect, it, vi } from 'vitest';

const replaySubscriptionEventsMock = vi.fn();
const prismaMock = {
  subscriptionEvent: {
    findMany: vi.fn(),
    groupBy: vi.fn(),
    findFirst: vi.fn(),
  },
};

vi.mock('@/lib/subscriptionEventReplay', () => ({
  replaySubscriptionEvents: replaySubscriptionEventsMock,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}));

describe('/api/admin/jobs/subscription-events route', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.ADMIN_TOKEN = 'admin_test_token';
    replaySubscriptionEventsMock.mockResolvedValue({
      replayed: [],
      errors: [],
      requested: 0,
    });
    prismaMock.subscriptionEvent.findMany.mockResolvedValue([]);
    prismaMock.subscriptionEvent.groupBy.mockResolvedValue([
      { status: 'failed', _count: { _all: 2 } },
      { status: 'dead_lettered', _count: { _all: 1 } },
    ]);
    prismaMock.subscriptionEvent.findFirst.mockResolvedValue(null);
  });

  it('rejects auto mode replay for dead lettered status', async () => {
    const { POST } = await import('./route');
    const req = new Request('http://localhost/api/admin/jobs/subscription-events', {
      method: 'POST',
      headers: {
        'x-admin-token': 'admin_test_token',
      },
      body: JSON.stringify({
        mode: 'auto',
        status: 'dead_lettered',
      }),
    });

    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('auto mode cannot replay dead lettered events');
    expect(replaySubscriptionEventsMock).not.toHaveBeenCalled();
  });

  it('forces failed-only statuses in auto mode', async () => {
    const { POST } = await import('./route');
    const req = new Request('http://localhost/api/admin/jobs/subscription-events', {
      method: 'POST',
      headers: {
        'x-admin-token': 'admin_test_token',
      },
      body: JSON.stringify({
        mode: 'auto',
        status: 'all',
        provider: 'stripe',
        limit: 99,
      }),
    });

    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(replaySubscriptionEventsMock).toHaveBeenCalledWith({
      eventId: undefined,
      provider: 'stripe',
      limit: 50,
      eligibleOnly: true,
      statuses: ['failed'],
    });
  });

  it('returns dead letter summary in GET status view', async () => {
    prismaMock.subscriptionEvent.findFirst.mockResolvedValueOnce({
      created_at: new Date('2026-01-01T00:00:00.000Z'),
    });

    const { GET } = await import('./route');
    const url = new URL('http://localhost/api/admin/jobs/subscription-events?status=all&provider=stripe&limit=5');
    const req = {
      headers: new Headers({ 'x-admin-token': 'admin_test_token' }),
      nextUrl: url,
    };

    const res = await GET(req as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(prismaMock.subscriptionEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: { in: ['failed', 'dead_lettered'] }, provider: 'stripe' },
        take: 5,
      }),
    );
    expect(data.dead_letter_summary).toEqual({
      count: 1,
      oldest_created_at: '2026-01-01T00:00:00.000Z',
    });
  });
});
