import { prisma } from '@/lib/prisma';

/**
 * Latest activity in the catalog: per-row max(trade date, disclosure date), then max over all rows.
 * (Ordering only by traded_at and taking one row can miss a newer published_at on another row.)
 */
export async function getGlobalLatestTradeActivity(): Promise<Date> {
  const rows = await prisma.$queryRaw<Array<{ d: Date | null }>>`
    SELECT MAX(GREATEST("traded_at", COALESCE("published_at", "traded_at"))) AS d
    FROM "Trade"
  `;
  const d = rows[0]?.d;
  return d ? new Date(d) : new Date(0);
}
