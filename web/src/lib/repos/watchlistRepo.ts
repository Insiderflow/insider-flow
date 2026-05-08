import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/prisma';

export async function isPoliticianWatchedByUser(userId: string, politicianId: string) {
  const item = await prisma.userWatchlist.findFirst({
    where: {
      user_id: userId,
      watchlist_type: 'politician',
      politician_id: politicianId,
    },
    select: { id: true },
  });
  return Boolean(item);
}

export async function togglePoliticianWatchlist(userId: string, politicianId: string) {
  const existing = await prisma.userWatchlist.findFirst({
    where: {
      user_id: userId,
      watchlist_type: 'politician',
      politician_id: politicianId,
    },
    select: { id: true },
  });

  if (existing) {
    await prisma.userWatchlist.delete({ where: { id: existing.id } });
    return { watching: false as const };
  }

  await prisma.userWatchlist.create({
    data: {
      user_id: userId,
      watchlist_type: 'politician',
      politician_id: politicianId,
    },
  });
  return { watching: true as const };
}

export async function getWatchlistUsersByPolitician(politicianId: string) {
  return prisma.user.findMany({
    where: {
      email_verified: true,
      UserWatchlist: { some: { watchlist_type: 'politician', politician_id: politicianId } },
      OR: [
        { notification_settings: { equals: Prisma.JsonNull } },
        { notification_settings: { path: ['watchlistUpdates'], equals: true } },
      ],
    },
    select: {
      id: true,
      email: true,
    },
  });
}
