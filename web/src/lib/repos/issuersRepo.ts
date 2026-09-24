import { prisma } from '@/lib/prisma';

export type SortOrder = 'asc' | 'desc';

export type IssuerListItem = {
  id: string;
  name: string;
  ticker: string | null;
  sector: string | null;
  country: string | null;
  trades: number;
  politicians: number;
  totalVolume: number;
  lastTraded: Date | null;
  price: number | null;
  change30dPct: number | null;
  trend: 'up' | 'down' | 'flat' | 'na';
};

type IssuerChartPoint = {
  period: string;
  buyVolume: number;
  sellVolume: number;
  sp500Close: number | null;
};

async function fetchTickerSnapshot(ticker: string | null): Promise<{
  price: number | null;
  change30dPct: number | null;
  trend: IssuerListItem['trend'];
}> {
  const rawTicker = (ticker || '').trim().toUpperCase();
  const cleanTicker = rawTicker
    .replace(/\.US$/i, '')
    .replace(/\.NYSE$/i, '')
    .replace(/\.NASDAQ$/i, '')
    .replace(/\./g, '-');
  if (!cleanTicker) return { price: null, change30dPct: null, trend: 'na' };

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(cleanTicker)}?range=1mo&interval=1d`;
    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!response.ok) return { price: null, change30dPct: null, trend: 'na' };

    const data = await response.json();
    const closes: unknown[] = data?.chart?.result?.[0]?.indicators?.quote?.[0]?.close ?? [];
    const validCloses = closes
      .map((v) => (typeof v === 'number' ? v : Number(v)))
      .filter((v) => Number.isFinite(v));

    const first = validCloses[0];
    const last = validCloses[validCloses.length - 1];
    const price = Number.isFinite(last) ? last : null;
    if (price === null || !Number.isFinite(first) || first === 0) {
      return { price, change30dPct: null, trend: price === null ? 'na' : 'flat' };
    }
    const change30dPct = ((price - first) / first) * 100;
    return {
      price,
      change30dPct,
      trend: change30dPct > 0 ? 'up' : change30dPct < 0 ? 'down' : 'flat',
    };
  } catch {
    return { price: null, change30dPct: null, trend: 'na' };
  }
}

function quarterKey(date: Date) {
  const year = date.getUTCFullYear();
  const quarter = Math.floor(date.getUTCMonth() / 3) + 1;
  return `${year}-Q${quarter}`;
}

async function fetchSp500QuarterlyCloses(): Promise<Map<string, number>> {
  try {
    const url = 'https://query1.finance.yahoo.com/v8/finance/chart/%5EGSPC?range=5y&interval=1mo';
    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!response.ok) return new Map();
    const data = await response.json();
    const result = data?.chart?.result?.[0];
    const timestamps: number[] = result?.timestamp ?? [];
    const closes: unknown[] = result?.indicators?.quote?.[0]?.close ?? [];
    const map = new Map<string, number>();
    timestamps.forEach((ts, idx) => {
      const close = typeof closes[idx] === 'number' ? closes[idx] : Number(closes[idx]);
      if (!Number.isFinite(close)) return;
      const key = quarterKey(new Date(ts * 1000));
      map.set(key, close);
    });
    return map;
  } catch {
    return new Map();
  }
}

export async function getIssuersPageData(params: {
  page: number;
  pageSize: number;
  query?: string;
  sortBy?: 'name' | 'trades' | 'politicians' | 'volume' | 'lastTraded' | 'price' | 'change30dPct';
  order?: SortOrder;
}) {
  const where = params.query
    ? {
        OR: [
          { name: { contains: params.query, mode: 'insensitive' as const } },
          { ticker: { contains: params.query, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const issuers = await prisma.issuer.findMany({
    where,
    select: {
      id: true,
      name: true,
      ticker: true,
      sector: true,
      country: true,
      Trade: {
        select: {
          traded_at: true,
          politician_id: true,
          size_min: true,
          size_max: true,
        },
      },
    },
  });

  const rows: IssuerListItem[] = issuers.map((issuer) => {
    const trades = issuer.Trade;
    let totalVolume = 0;
    let lastTraded: Date | null = null;
    const politicianSet = new Set<string>();

    for (const trade of trades) {
      politicianSet.add(trade.politician_id);
      const min = trade.size_min ? Number(trade.size_min) : 0;
      const max = trade.size_max ? Number(trade.size_max) : 0;
      totalVolume += (min + max) / 2;
      if (!lastTraded || trade.traded_at > lastTraded) {
        lastTraded = trade.traded_at;
      }
    }

    return {
      id: issuer.id,
      name: issuer.name,
      ticker: issuer.ticker,
      sector: issuer.sector,
      country: issuer.country,
      trades: trades.length,
      politicians: politicianSet.size,
      totalVolume,
      lastTraded,
      price: null,
      change30dPct: null,
      trend: 'na',
    };
  });

  const snapshots = await Promise.all(rows.map((r) => fetchTickerSnapshot(r.ticker)));
  rows.forEach((row, idx) => {
    row.price = snapshots[idx].price;
    row.change30dPct = snapshots[idx].change30dPct;
    row.trend = snapshots[idx].trend;
  });

  const sortBy = params.sortBy || 'trades';
  const order = params.order || 'desc';
  const dir = order === 'asc' ? 1 : -1;

  rows.sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name) * dir;
    if (sortBy === 'politicians') return (a.politicians - b.politicians) * dir;
    if (sortBy === 'volume') return (a.totalVolume - b.totalVolume) * dir;
    if (sortBy === 'price') return ((a.price || 0) - (b.price || 0)) * dir;
    if (sortBy === 'change30dPct') return ((a.change30dPct || 0) - (b.change30dPct || 0)) * dir;
    if (sortBy === 'lastTraded') {
      const at = a.lastTraded ? a.lastTraded.getTime() : 0;
      const bt = b.lastTraded ? b.lastTraded.getTime() : 0;
      return (at - bt) * dir;
    }
    return (a.trades - b.trades) * dir;
  });

  const total = rows.length;
  const start = (params.page - 1) * params.pageSize;

  return {
    rows: rows.slice(start, start + params.pageSize),
    total,
  };
}

export async function getIssuerDetailData(id: string) {
  const issuer = await prisma.issuer.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      ticker: true,
      sector: true,
      country: true,
    },
  });

  if (!issuer) return null;

  const [tradeStats, politicianTradeGroups, recentTrades, allTradesForChart, sp500Quarterly] = await Promise.all([
    prisma.trade.aggregate({
      where: { issuer_id: id },
      _count: { _all: true },
      _sum: { size_min: true, size_max: true },
      _max: { traded_at: true, size_max: true },
    }),
    prisma.trade.groupBy({
      by: ['politician_id'],
      where: { issuer_id: id },
      _count: { politician_id: true },
      _sum: { size_min: true, size_max: true },
      _max: { traded_at: true },
      orderBy: { _count: { politician_id: 'desc' } },
      take: 100,
    }),
    prisma.trade.findMany({
      where: { issuer_id: id },
      include: { Politician: true },
      orderBy: { traded_at: 'desc' },
      take: 30,
    }),
    prisma.trade.findMany({
      where: { issuer_id: id },
      select: { traded_at: true, type: true, size_min: true, size_max: true },
    }),
    fetchSp500QuarterlyCloses(),
  ]);

  const politicianIds = politicianTradeGroups.map((g) => g.politician_id);
  const politicianMap = new Map(
    (
      await prisma.politician.findMany({
        where: { id: { in: politicianIds } },
        select: { id: true, name: true, party: true, chamber: true, state: true },
      })
    ).map((p) => [p.id, p])
  );

  const politicians = politicianTradeGroups
    .map((row) => {
      const p = politicianMap.get(row.politician_id);
      if (!p) return null;
      const min = row._sum.size_min ? Number(row._sum.size_min) : 0;
      const max = row._sum.size_max ? Number(row._sum.size_max) : 0;
      return {
        id: p.id,
        name: p.name,
        party: p.party,
        chamber: p.chamber,
        state: p.state,
        trades: row._count.politician_id,
        totalVolume: (min + max) / 2,
        lastTraded: row._max.traded_at || null,
      };
    })
    .filter((v): v is NonNullable<typeof v> => Boolean(v));

  const chartMap = new Map<string, { buyVolume: number; sellVolume: number }>();
  for (const trade of allTradesForChart) {
    const key = quarterKey(trade.traded_at);
    const current = chartMap.get(key) || { buyVolume: 0, sellVolume: 0 };
    const min = trade.size_min ? Number(trade.size_min) : 0;
    const max = trade.size_max ? Number(trade.size_max) : 0;
    const amount = (min + max) / 2;
    const t = (trade.type || '').toUpperCase();
    if (t.includes('BUY')) current.buyVolume += amount;
    if (t.includes('SELL')) current.sellVolume += amount;
    chartMap.set(key, current);
  }

  const chartPoints: IssuerChartPoint[] = Array.from(chartMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, v]) => ({
      period,
      buyVolume: v.buyVolume,
      sellVolume: v.sellVolume,
      sp500Close: sp500Quarterly.get(period) ?? null,
    }));

  return {
    issuer,
    stats: {
      trades: tradeStats._count._all,
      politicians: politicians.length,
      totalVolume:
        ((tradeStats._sum.size_min ? Number(tradeStats._sum.size_min) : 0) +
          (tradeStats._sum.size_max ? Number(tradeStats._sum.size_max) : 0)) /
        2,
      maxTrade: tradeStats._max.size_max ? Number(tradeStats._max.size_max) : 0,
      lastTraded: tradeStats._max.traded_at || null,
    },
    politicians,
    chartPoints,
    recentTrades: recentTrades.map((t) => ({
      id: t.id,
      tradedAt: t.traded_at,
      publishedAt: t.published_at,
      type: t.type,
      price: t.price ? Number(t.price) : null,
      sizeMin: t.size_min ? Number(t.size_min) : null,
      sizeMax: t.size_max ? Number(t.size_max) : null,
      politician: {
        id: t.Politician.id,
        name: t.Politician.name,
      },
    })),
  };
}

/** Prefer explicit issuer; else pick duplicate ticker with the most Trade rows. */
export async function resolveIssuerIdByTicker(
  ticker: string,
  preferredIssuerId?: string | null,
): Promise<string | null> {
  const normalized = ticker.trim().toUpperCase();
  if (!normalized) return null;

  if (preferredIssuerId) {
    const preferred = await prisma.issuer.findUnique({
      where: { id: preferredIssuerId },
      select: { id: true, ticker: true },
    });
    if (
      preferred?.ticker &&
      preferred.ticker.trim().toUpperCase() === normalized
    ) {
      return preferred.id;
    }
  }

  const candidates = await prisma.issuer.findMany({
    where: { ticker: { equals: normalized, mode: 'insensitive' } },
    select: { id: true },
  });
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0].id;

  const counts = await prisma.trade.groupBy({
    by: ['issuer_id'],
    where: { issuer_id: { in: candidates.map((c) => c.id) } },
    _count: { _all: true },
  });
  const countByIssuer = new Map(
    counts.map((row) => [row.issuer_id, row._count._all]),
  );

  let bestId = candidates[0].id;
  let bestCount = -1;
  for (const c of candidates) {
    const n = countByIssuer.get(c.id) || 0;
    if (n > bestCount) {
      bestCount = n;
      bestId = c.id;
    }
  }
  return bestId;
}
