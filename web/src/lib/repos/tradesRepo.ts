import { prisma } from '@/lib/prisma';

export type TradeSortKey = 'traded_at' | 'published_at' | 'size_max' | 'price';
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

export async function getTradesPageData(query: TradesQuery) {
  const normalizedType = normalizeType(query.type);
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
    prisma.trade.findFirst({
      where,
      orderBy: { traded_at: 'desc' },
      select: { traded_at: true },
    }).then((r) => r?.traded_at || new Date()),
  ]);

  const mappedRows: TradeListItem[] = rows.map((row) => ({
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

export async function getLatestTradesPublic(limit = 10) {
  const rows = await prisma.trade.findMany({
    where: { published_at: { not: null } },
    include: { Politician: true, Issuer: true },
    orderBy: [{ published_at: 'desc' }, { traded_at: 'desc' }],
    take: limit,
  });

  return rows.map((row) => ({
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
