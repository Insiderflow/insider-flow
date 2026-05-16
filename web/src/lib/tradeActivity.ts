import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

/** Per-row “what’s new” for Capitol STOCK rows: later of trade date vs disclosure date. */
export const TRADE_ACTIVITY_ORDER_SQL = Prisma.sql`GREATEST(t."traded_at", COALESCE(t."published_at", t."traded_at"))`;

export type ActivityTradeFilters = {
  politician?: string;
  issuer?: string;
  type?: string;
  tradedFrom?: string;
  tradedTo?: string;
};

export function buildActivityTradeWhereSql(filters: ActivityTradeFilters): Prisma.Sql {
  const parts: Prisma.Sql[] = [];

  if (filters.politician?.trim()) {
    parts.push(Prisma.sql`p.name ILIKE ${`%${filters.politician.trim()}%`}`);
  }
  if (filters.issuer?.trim()) {
    parts.push(Prisma.sql`i.name ILIKE ${`%${filters.issuer.trim()}%`}`);
  }
  if (filters.type?.trim()) {
    const t = filters.type.trim().toUpperCase();
    if (t === 'BUY' || t === 'SELL' || t === 'EXCHANGE') {
      parts.push(Prisma.sql`t.type = ${t}`);
    }
  }
  if (filters.tradedFrom) {
    parts.push(Prisma.sql`t.traded_at >= ${new Date(filters.tradedFrom)}`);
  }
  if (filters.tradedTo) {
    parts.push(Prisma.sql`t.traded_at <= ${new Date(`${filters.tradedTo}T23:59:59.999Z`)}`);
  }

  if (parts.length === 0) return Prisma.sql`TRUE`;
  return Prisma.join(parts, ' AND ');
}

/**
 * Latest activity in the catalog: per-row max(trade date, disclosure date), then max over all rows.
 */
export async function getGlobalLatestTradeActivity(): Promise<Date> {
  const rows = await prisma.$queryRaw<Array<{ d: Date | null }>>`
    SELECT MAX(GREATEST("traded_at", COALESCE("published_at", "traded_at"))) AS d
    FROM "Trade"
  `;
  const d = rows[0]?.d;
  return d ? new Date(d) : new Date(0);
}

export async function getMaxTradeActivityForFilters(filters: ActivityTradeFilters): Promise<Date> {
  const where = buildActivityTradeWhereSql(filters);
  const needsJoin =
    Boolean(filters.politician?.trim()) ||
    Boolean(filters.issuer?.trim()) ||
    Boolean(filters.type?.trim());

  if (!needsJoin && !filters.tradedFrom && !filters.tradedTo) {
    return getGlobalLatestTradeActivity();
  }

  const rows = await prisma.$queryRaw<Array<{ d: Date | null }>>`
    SELECT MAX(${TRADE_ACTIVITY_ORDER_SQL}) AS d
    FROM "Trade" t
    INNER JOIN "Politician" p ON t.politician_id = p.id
    INNER JOIN "Issuer" i ON t.issuer_id = i.id
    WHERE ${where}
  `;
  const d = rows[0]?.d;
  return d ? new Date(d) : new Date(0);
}

export function activityFilterNeedsJoin(filters: ActivityTradeFilters): boolean {
  return Boolean(filters.politician?.trim() || filters.issuer?.trim() || filters.type?.trim());
}

export async function findTradeIdsByActivityOrder(options: {
  limit: number;
  skip?: number;
  filters?: ActivityTradeFilters;
}): Promise<string[]> {
  const skip = options.skip ?? 0;
  const filters = options.filters ?? {};
  const where = buildActivityTradeWhereSql(filters);
  const needsJoin = activityFilterNeedsJoin(filters);

  const rows = needsJoin
    ? await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT t.id
        FROM "Trade" t
        INNER JOIN "Politician" p ON t.politician_id = p.id
        INNER JOIN "Issuer" i ON t.issuer_id = i.id
        WHERE ${where}
        ORDER BY ${TRADE_ACTIVITY_ORDER_SQL} DESC NULLS LAST
        LIMIT ${options.limit} OFFSET ${skip}
      `
    : await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT t.id
        FROM "Trade" t
        WHERE ${where}
        ORDER BY ${TRADE_ACTIVITY_ORDER_SQL} DESC NULLS LAST
        LIMIT ${options.limit} OFFSET ${skip}
      `;

  return rows.map((r) => r.id);
}

export async function countTradesForActivityFilters(filters: ActivityTradeFilters): Promise<number> {
  const where = buildActivityTradeWhereSql(filters);
  const needsJoin =
    Boolean(filters.politician?.trim()) ||
    Boolean(filters.issuer?.trim()) ||
    Boolean(filters.type?.trim());

  const rows = needsJoin
    ? await prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*)::bigint AS count
        FROM "Trade" t
        INNER JOIN "Politician" p ON t.politician_id = p.id
        INNER JOIN "Issuer" i ON t.issuer_id = i.id
        WHERE ${where}
      `
    : await prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*)::bigint AS count
        FROM "Trade" t
        WHERE ${where}
      `;

  return Number(rows[0]?.count ?? 0);
}
