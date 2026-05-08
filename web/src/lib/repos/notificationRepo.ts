import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export async function getRecentTradesForNotification(since: Date, limit = 200) {
  return prisma.trade.findMany({
    where: {
      traded_at: { gte: since },
    },
    include: {
      Politician: { select: { id: true, name: true } },
      Issuer: { select: { id: true, name: true, ticker: true } },
    },
    orderBy: { traded_at: 'desc' },
    take: limit,
  });
}

export async function createWatchlistAlertIfNotExists(params: {
  userId: string;
  tradeId: string;
  politicianName: string;
  issuerName: string;
  tradeType: string;
  tradedAt: Date;
}) {
  const sourceKey = `watchlist_trade:${params.tradeId}:user:${params.userId}`;
  try {
    await prisma.alert.create({
      data: {
        user_id: params.userId,
        type: 'watchlist',
        title: `${params.politicianName} 議員有新交易`,
        body: `${params.tradeType.toUpperCase()} ${params.issuerName} (${params.tradedAt.toLocaleDateString('zh-TW')})`,
        source_key: sourceKey,
      },
    });
    return { created: true as const, sourceKey };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return { created: false as const, sourceKey };
    }
    throw error;
  }
}

export async function disableNotificationSetting(userId: string, key: 'watchlistUpdates') {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { notification_settings: true },
  });
  const settings = (user?.notification_settings as Record<string, boolean> | null) || {};
  settings[key] = false;
  await prisma.user.update({
    where: { id: userId },
    data: { notification_settings: settings },
  });
}
