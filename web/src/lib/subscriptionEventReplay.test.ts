import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = {
  subscriptionEvent: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
};

vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}));

describe('replaySubscriptionEvents', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    prismaMock.subscriptionEvent.findMany.mockResolvedValue([]);
  });

  it('uses eligible-only query guard for scheduler-safe retries', async () => {
    const { replaySubscriptionEvents } = await import('./subscriptionEventReplay');
    await replaySubscriptionEvents({ provider: 'stripe', eligibleOnly: true, limit: 999 });

    expect(prismaMock.subscriptionEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: { in: ['failed'] },
          provider: 'stripe',
          OR: [{ next_retry_at: null }, { next_retry_at: { lte: expect.any(Date) } }],
        },
        orderBy: { next_retry_at: 'asc' },
        take: 50,
      }),
    );
  });

  it('omits eligibility filter when eligibleOnly is false', async () => {
    const { replaySubscriptionEvents } = await import('./subscriptionEventReplay');
    await replaySubscriptionEvents({ eligibleOnly: false, limit: 0 });

    expect(prismaMock.subscriptionEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: { in: ['failed'] } },
        take: 1,
      }),
    );
  });

  it('supports replaying dead lettered events when explicitly requested', async () => {
    const { replaySubscriptionEvents } = await import('./subscriptionEventReplay');
    await replaySubscriptionEvents({ statuses: ['dead_lettered'], limit: 5 });

    expect(prismaMock.subscriptionEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: { in: ['dead_lettered'] } },
        take: 5,
      }),
    );
  });
});
