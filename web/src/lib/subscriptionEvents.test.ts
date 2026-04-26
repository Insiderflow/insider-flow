import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = {
  subscriptionEvent: {
    findUnique: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
  },
};

vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}));

describe('markSubscriptionEventFailed', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    delete process.env.SUBSCRIPTION_EVENT_MAX_RETRIES;
  });

  it('marks event as dead_lettered at max retries', async () => {
    process.env.SUBSCRIPTION_EVENT_MAX_RETRIES = '3';
    prismaMock.subscriptionEvent.findUnique.mockResolvedValue({ retry_count: 2 });
    prismaMock.subscriptionEvent.update.mockResolvedValue({});

    const { markSubscriptionEventFailed } = await import('./subscriptionEvents');
    await markSubscriptionEventFailed('evt_1', 'permanent failure');

    expect(prismaMock.subscriptionEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'evt_1' },
        data: expect.objectContaining({
          status: 'dead_lettered',
          retry_count: 3,
          next_retry_at: null,
          error: 'permanent failure',
        }),
      }),
    );
  });

  it('keeps failed status with next retry before dead letter threshold', async () => {
    process.env.SUBSCRIPTION_EVENT_MAX_RETRIES = '5';
    prismaMock.subscriptionEvent.findUnique.mockResolvedValue({ retry_count: 1 });
    prismaMock.subscriptionEvent.update.mockResolvedValue({});

    const { markSubscriptionEventFailed } = await import('./subscriptionEvents');
    await markSubscriptionEventFailed('evt_2', 'retry later');

    expect(prismaMock.subscriptionEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'evt_2' },
        data: expect.objectContaining({
          status: 'failed',
          retry_count: 2,
          next_retry_at: expect.any(Date),
          error: 'retry later',
        }),
      }),
    );
  });
});
