import { prisma } from '@/lib/prisma';
import {
  countTradesForActivityFilters,
  findTradeIdsByActivityOrder,
  getMaxTradeActivityForFilters,
  type ActivityTradeFilters,
} from '@/lib/tradeActivity';

export type TradeSortKey = 'traded_at' | 'published_at' | 'activity' | 'size_max' | 'price';
export type SortOrder = 'asc' | 'desc';

export type TradesQuery = {
  page: number;
  pageSize: number;
  sortBy: TradeSortKey;
  order: SortOrder;
  politician?: string;
  issuer?: string;
  type?: string;
  tradedFrom?: string;
  tradedTo?: string;
};

export type TradeListItem = {
  id: string;
  type: string;
  tradedAt: Date;
  publishedAt: Date | null;
  sizeMin: number | null;
  sizeMax: number | null;
  price: number | null;
  owner: string | null;
  politician: {
    id: string;
    name: string;
    party: string | null;
    chamber: string | null;
  };
  issuer: {
    id: string;
    name: string;
    ticker: string | null;
  };
};

function normalizeType(input?: string) {
  if (!input) return undefined;
  const t = input.trim().toUpperCase();
  if (t === 'BUY' || t === 'SELL' || t === 'EXCHANGE') return t;
  return undefined;
}

function activityFiltersFromQuery(query: TradesQuery): ActivityTradeFilters {
  const normalizedType = normalizeType(query.type);
  return {
    politician: query.politician,
    issuer: query.issuer,
    type: normalizedType,
    tradedFrom: query.tradedFrom,
    tradedTo: query.tradedTo,
  };
}

function mapTradeRows(
  rows: Array<{
    id: string;
    type: string;
    traded_at: Date;
    published_at: Date | null;
    size_min: unknown;
    size_max: unknown;
    price: unknown;
    owner: string | null;
    Politician: { id: string; name: string; party: string | null; chamber: string | null };
    Issuer: { id: string; name: string; ticker: string | null };
  }>,
): TradeListItem[] {
  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    tradedAt: row.traded_at,
    publishedAt: row.published_at,
    sizeMin: row.size_min ? Number(row.size_min) : null,
    sizeMax: row.size_max ? Number(row.size_max) : null,
    price: row.price ? Number(row.price) : null,
    owner: row.owner || null,
    politician: {
      id: row.Politician.id,
      name: row.Politician.name,
      party: row.Politician.party,
      chamber: row.Politician.chamber,
    },
    issuer: {
      id: row.Issuer.id,
      name: row.Issuer.name,
      ticker: row.Issuer.ticker,
    },
  }));
}

async function hydrateTradesByIds(ids: string[]): Promise<TradeListItem[]> {
  if (ids.length === 0) return [];
  const rows = await prisma.trade.findMany({
    where: { id: { in: ids } },
    include: { Politician: true, Issuer: true },
  });
  const byId = new Map(rows.map((r) => [r.id, r]));
  const ordered = ids.map((id) => byId.get(id)).filter((r): r is NonNullable<typeof r> => Boolean(r));
  return mapTradeRows(ordered);
}

export async function getTradesPageData(query: TradesQuery) {
  const normalizedType = normalizeType(query.type);
  const activityFilters = activityFiltersFromQuery(query);

  if (query.sortBy === 'activity') {
    if (query.order === 'asc') {
      // Rare; fall back to disclosure-first ascending via published_at then traded_at.
      const where = {
        ...(query.politician
          ? { Politician: { is: { name: { contains: query.politician, mode: 'insensitive' as const } } } }
          : {}),
        ...(query.issuer ? { Issuer: { is: { name: { contains: query.issuer, mode: 'insensitive' as const } } } } : {}),
        ...(normalizedType ? { type: normalizedType } : {}),
        ...(query.tradedFrom || query.tradedTo
          ? {
              traded_at: {
                ...(query.tradedFrom ? { gte: new Date(query.tradedFrom) } : {}),
                ...(query.tradedTo ? { lte: new Date(`${query.tradedTo}T23:59:59.999Z`) } : {}),
              },
            }
          : {}),
      };

      const [rows, total, distinctPoliticians, distinctIssuers, lastTradeDate] = await Promise.all([
        prisma.trade.findMany({
          where,
          include: { Politician: true, Issuer: true },
          orderBy: [{ published_at: 'asc' }, { traded_at: 'asc' }],
          skip: (query.page - 1) * query.pageSize,
          take: query.pageSize,
        }),
        prisma.trade.count({ where }),
        prisma.trade.groupBy({ by: ['politician_id'], where }),
        prisma.trade.groupBy({ by: ['issuer_id'], where }),
        getMaxTradeActivityForFilters(activityFilters),
      ]);

      return {
        rows: mapTradeRows(rows),
        total,
        stats: {
          tradeCount: total,
          politicianCount: distinctPoliticians.length,
          issuerCount: distinctIssuers.length,
        },
        lastTradeDate,
      };
    }

    const skip = (query.page - 1) * query.pageSize;
    const [ids, total, distinctPoliticians, distinctIssuers, lastTradeDate] = await Promise.all([
      findTradeIdsByActivityOrder({ limit: query.pageSize, skip, filters: activityFilters }),
      countTradesForActivityFilters(activityFilters),
      prisma.trade.groupBy({
        by: ['politician_id'],
        where: {
          ...(query.politician
            ? { Politician: { is: { name: { contains: query.politician, mode: 'insensitive' as const } } } }
            : {}),
          ...(query.issuer ? { Issuer: { is: { name: { contains: query.issuer, mode: 'insensitive' as const } } } } : {}),
          ...(normalizedType ? { type: normalizedType } : {}),
          ...(query.tradedFrom || query.tradedTo
            ? {
                traded_at: {
                  ...(query.tradedFrom ? { gte: new Date(query.tradedFrom) } : {}),
                  ...(query.tradedTo ? { lte: new Date(`${query.tradedTo}T23:59:59.999Z`) } : {}),
                },
              }
            : {}),
        },
      }),
      prisma.trade.groupBy({
        by: ['issuer_id'],
        where: {
          ...(query.politician
            ? { Politician: { is: { name: { contains: query.politician, mode: 'insensitive' as const } } } }
            : {}),
          ...(query.issuer ? { Issuer: { is: { name: { contains: query.issuer, mode: 'insensitive' as const } } } } : {}),
          ...(normalizedType ? { type: normalizedType } : {}),
          ...(query.tradedFrom || query.tradedTo
            ? {
                traded_at: {
                  ...(query.tradedFrom ? { gte: new Date(query.tradedFrom) } : {}),
                  ...(query.tradedTo ? { lte: new Date(`${query.tradedTo}T23:59:59.999Z`) } : {}),
                },
              }
            : {}),
        },
      }),
      getMaxTradeActivityForFilters(activityFilters),
    ]);

    const mappedRows = await hydrateTradesByIds(ids);

    return {
      rows: mappedRows,
      total,
      stats: {
        tradeCount: total,
        politicianCount: distinctPoliticians.length,
        issuerCount: distinctIssuers.length,
      },
      lastTradeDate,
    };
  }

  const where = {
    ...(query.politician
      ? { Politician: { is: { name: { contains: query.politician, mode: 'insensitive' as const } } } }
      : {}),
    ...(query.issuer ? { Issuer: { is: { name: { contains: query.issuer, mode: 'insensitive' as const } } } } : {}),
    ...(normalizedType ? { type: normalizedType } : {}),
    ...(query.tradedFrom || query.tradedTo
      ? {
          traded_at: {
            ...(query.tradedFrom ? { gte: new Date(query.tradedFrom) } : {}),
            ...(query.tradedTo ? { lte: new Date(`${query.tradedTo}T23:59:59.999Z`) } : {}),
          },
        }
      : {}),
    ...(query.sortBy === 'published_at' ? { published_at: { not: null } } : {}),
  };

  const [rows, total, distinctPoliticians, distinctIssuers, lastTradeDate] = await Promise.all([
    prisma.trade.findMany({
      where,
      include: { Politician: true, Issuer: true },
      orderBy: { [query.sortBy]: query.order },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.trade.count({ where }),
    prisma.trade.groupBy({ by: ['politician_id'], where }),
    prisma.trade.groupBy({ by: ['issuer_id'], where }),
    getMaxTradeActivityForFilters(activityFilters),
  ]);

  return {
    rows: mapTradeRows(rows),
    total,
    stats: {
      tradeCount: total,
      politicianCount: distinctPoliticians.length,
      issuerCount: distinctIssuers.length,
    },
    lastTradeDate,
  };
}

export async function getLatestTradesPublic(limit = 10) {
  const ids = await findTradeIdsByActivityOrder({ limit });
  if (ids.length === 0) return [];

  const rows = await prisma.trade.findMany({
    where: { id: { in: ids } },
    include: { Politician: true, Issuer: true },
  });
  const byId = new Map(rows.map((r) => [r.id, r]));

  return ids
    .map((id) => byId.get(id))
    .filter((r): r is NonNullable<typeof r> => Boolean(r))
    .map((row) => ({
      id: row.id,
      type: row.type,
      tradedAt: row.traded_at,
      publishedAt: row.published_at,
      sizeMin: row.size_min ? Number(row.size_min) : null,
      sizeMax: row.size_max ? Number(row.size_max) : null,
      price: row.price ? Number(row.price) : null,
      politician: {
        id: row.Politician.id,
        name: row.Politician.name,
        party: row.Politician.party,
        state: row.Politician.state,
      },
      issuer: {
        id: row.Issuer.id,
        name: row.Issuer.name,
        ticker: row.Issuer.ticker,
      },
    }));
}
