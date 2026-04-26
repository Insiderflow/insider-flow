import { prisma } from '@/lib/prisma';

function parseProvider(value: unknown): 'stripe' | 'revenuecat' | undefined {
  if (value === 'stripe' || value === 'revenuecat') return value;
  return undefined;
}

export async function getSubscriptionEventMetrics(providerInput?: unknown) {
  const provider = parseProvider(providerInput);
  const now = new Date();
  const providerWhere = provider ? { provider } : undefined;

  const [
    totalEvents,
    statusCounts,
    providerCounts,
    eventTypeCounts,
    dueNowCount,
    oldestFailed,
    oldestDeadLettered,
    latestProcessed,
  ] = await Promise.all([
    prisma.subscriptionEvent.count({ where: providerWhere }),
    prisma.subscriptionEvent.groupBy({
      by: ['status'],
      where: providerWhere,
      _count: { _all: true },
    }),
    prisma.subscriptionEvent.groupBy({
      by: ['provider'],
      where: providerWhere,
      _count: { _all: true },
    }),
    prisma.subscriptionEvent.groupBy({
      by: ['event_type'],
      where: providerWhere,
      _count: { _all: true },
      orderBy: {
        _count: { event_type: 'desc' },
      },
      take: 20,
    }),
    prisma.subscriptionEvent.count({
      where: {
        ...(providerWhere || {}),
        status: 'failed',
        OR: [{ next_retry_at: null }, { next_retry_at: { lte: now } }],
      },
    }),
    prisma.subscriptionEvent.findFirst({
      where: {
        ...(providerWhere || {}),
        status: 'failed',
      },
      orderBy: { created_at: 'asc' },
      select: { created_at: true },
    }),
    prisma.subscriptionEvent.findFirst({
      where: {
        ...(providerWhere || {}),
        status: 'dead_lettered',
      },
      orderBy: { created_at: 'asc' },
      select: { created_at: true },
    }),
    prisma.subscriptionEvent.findFirst({
      where: {
        ...(providerWhere || {}),
        status: 'processed',
        processed_at: { not: null },
      },
      orderBy: { processed_at: 'desc' },
      select: { processed_at: true },
    }),
  ]);

  const countsByStatus = statusCounts.reduce<Record<string, number>>((acc, row) => {
    acc[row.status] = row._count._all;
    return acc;
  }, {});
  const deadLetteredCount = countsByStatus.dead_lettered || 0;
  const failedCount = countsByStatus.failed || 0;
  const processedCount = countsByStatus.processed || 0;
  const deadLetterRate = totalEvents > 0 ? Number((deadLetteredCount / totalEvents).toFixed(4)) : 0;

  return {
    provider: provider || 'all',
    metrics: {
      total_events: totalEvents,
      status_counts: countsByStatus,
      provider_counts: providerCounts.reduce<Record<string, number>>((acc, row) => {
        acc[row.provider] = row._count._all;
        return acc;
      }, {}),
      event_type_counts: eventTypeCounts.map((row) => ({
        event_type: row.event_type,
        count: row._count._all,
      })),
      due_now_count: dueNowCount,
      oldest_failed_at: oldestFailed?.created_at?.toISOString() || null,
      oldest_dead_lettered_at: oldestDeadLettered?.created_at?.toISOString() || null,
      latest_processed_at: latestProcessed?.processed_at?.toISOString() || null,
      dead_lettered_count: deadLetteredCount,
      failed_count: failedCount,
      processed_count: processedCount,
      dead_letter_rate: deadLetterRate,
    },
  };
}
