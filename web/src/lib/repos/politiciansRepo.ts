import { prisma } from '@/lib/prisma';
import { sectorToZh } from '@/lib/sectorI18n';

export type PoliticianSortKey = 'trades' | 'volume' | 'name' | 'lastTraded';
export type SortOrder = 'asc' | 'desc';

type PoliticianChartPoint = {
  period: string;
  buyVolume: number;
  sellVolume: number;
  sp500Close: number | null;
};

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
      map.set(quarterKey(new Date(ts * 1000)), close);
    });
    return map;
  } catch {
    return new Map();
  }
}

export type PoliticianListItem = {
  id: string;
  name: string;
  party: string | null;
  chamber: string | null;
  state: string | null;
  trades: number;
  issuers: number;
  totalVolume: number;
  lastTraded: Date | null;
  maxTrade: number;
  recentTradeLabel: string;
  recentSector: string | null;
};


export async function getPoliticiansPageData(params: {
  page: number;
  pageSize: number;
  name?: string;
  chamber?: string;
  sortBy: PoliticianSortKey;
  order: SortOrder;
}) {
  const where = {
    ...(params.name ? { name: { contains: params.name, mode: 'insensitive' as const } } : {}),
    ...(params.chamber ? { chamber: params.chamber } : {}),
  };

  const allPoliticians = await prisma.politician.findMany({
    where,
    select: { id: true, name: true, party: true, chamber: true, state: true, _count: { select: { Trade: true } } },
  });

  const ids = allPoliticians.map((p) => p.id);
  const statsById = new Map<string, { totalVolume: number; maxTrade: number; lastTraded: Date | null; issuers: number; recentTradeLabel: string; recentSector: string | null }>();

  if (ids.length) {
    const [volRows, issuerRows, recentRows] = await Promise.all([
      prisma.trade.groupBy({
        by: ['politician_id'],
        where: { politician_id: { in: ids } },
        _sum: { size_min: true, size_max: true },
        _max: { size_max: true, traded_at: true, published_at: true },
      }),
      prisma.trade.groupBy({
        by: ['politician_id', 'issuer_id'],
        where: { politician_id: { in: ids } },
      }),
      prisma.trade.findMany({
        where: { politician_id: { in: ids } },
        orderBy: { traded_at: 'desc' },
        select: {
          politician_id: true,
          traded_at: true,
          Issuer: { select: { name: true, ticker: true, sector: true } },
        },
      }),
    ]);

    const issuerCountMap = new Map<string, number>();
    for (const row of issuerRows) {
      issuerCountMap.set(row.politician_id, (issuerCountMap.get(row.politician_id) || 0) + 1);
    }

    const recentMap = new Map<string, string>();
    const sectorMap = new Map<string, string | null>();
    for (const row of recentRows) {
      if (recentMap.has(row.politician_id)) continue;
      const issuerName = row.Issuer?.name || '未揭露';
      const ticker = row.Issuer?.ticker ? ` (${row.Issuer.ticker})` : '';
      recentMap.set(row.politician_id, `${issuerName}${ticker}`);
      sectorMap.set(row.politician_id, sectorToZh(row.Issuer?.sector) || null);
    }

    for (const row of volRows) {
      const min = row._sum.size_min ? Number(row._sum.size_min) : 0;
      const max = row._sum.size_max ? Number(row._sum.size_max) : 0;
      statsById.set(row.politician_id, {
        totalVolume: (min + max) / 2,
        maxTrade: row._max.size_max ? Number(row._max.size_max) : 0,
        lastTraded: (() => {
          const ta = row._max.traded_at;
          const pa = row._max.published_at;
          const t = ta?.getTime() ?? 0;
          const p = pa?.getTime() ?? 0;
          if (!t && !p) return null;
          return new Date(Math.max(t, p || 0));
        })(),
        issuers: issuerCountMap.get(row.politician_id) || 0,
        recentTradeLabel: recentMap.get(row.politician_id) || '無近期交易',
        recentSector: sectorMap.get(row.politician_id) || null,
      });
    }
  }

  const enriched: PoliticianListItem[] = allPoliticians.map((p) => {
    const stat = statsById.get(p.id);
    return {
      id: p.id,
      name: p.name,
      party: p.party,
      chamber: p.chamber,
      state: p.state,
      trades: p._count.Trade,
      issuers: stat?.issuers || 0,
      totalVolume: stat?.totalVolume || 0,
      lastTraded: stat?.lastTraded || null,
      maxTrade: stat?.maxTrade || 0,
      recentTradeLabel: stat?.recentTradeLabel || '無近期交易',
      recentSector: stat?.recentSector || null,
    };
  });

  const sorted = enriched.sort((a, b) => {
    const dir = params.order === 'asc' ? 1 : -1;
    if (params.sortBy === 'name') return a.name.localeCompare(b.name) * dir;
    if (params.sortBy === 'volume') return (a.totalVolume - b.totalVolume) * dir;
    if (params.sortBy === 'lastTraded') {
      const aTs = a.lastTraded ? a.lastTraded.getTime() : 0;
      const bTs = b.lastTraded ? b.lastTraded.getTime() : 0;
      return (aTs - bTs) * dir;
    }
    return (a.trades - b.trades) * dir;
  });

  const total = sorted.length;
  const start = (params.page - 1) * params.pageSize;
  const rows = sorted.slice(start, start + params.pageSize);
  return { rows, total };
}

export async function getPoliticianDetailData(params: {
  id: string;
  page: number;
  pageSize: number;
  sortBy: 'traded_at' | 'published_at' | 'price' | 'size_max';
  order: SortOrder;
}) {
  const politician = await prisma.politician.findUnique({
    where: { id: params.id },
    select: { id: true, name: true, party: true, chamber: true, state: true },
  });
  if (!politician) return null;

  const tradeWhere = {
    politician_id: params.id,
    ...(params.sortBy === 'published_at' ? { published_at: { not: null } } : {}),
  };

  const [totalTrades, stats, topIssuers, trades, allTradesForChart, sp500Quarterly] = await Promise.all([
    prisma.trade.count({ where: tradeWhere }),
    prisma.trade.aggregate({
      where: { politician_id: params.id },
      _sum: { size_min: true, size_max: true },
      _max: { size_max: true, traded_at: true, published_at: true },
    }),
    prisma.trade.groupBy({
      by: ['issuer_id'],
      where: { politician_id: params.id },
      _count: { issuer_id: true },
      orderBy: { _count: { issuer_id: 'desc' } },
      take: 8,
    }),
    prisma.trade.findMany({
      where: tradeWhere,
      include: { Issuer: true },
      orderBy: { [params.sortBy]: params.order },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    }),
    prisma.trade.findMany({
      where: { politician_id: params.id },
      select: { traded_at: true, type: true, size_min: true, size_max: true },
    }),
    fetchSp500QuarterlyCloses(),
  ]);

  const issuerIds = topIssuers.map((i) => i.issuer_id);
  const issuerMap = new Map(
    (await prisma.issuer.findMany({ where: { id: { in: issuerIds } }, select: { id: true, name: true, ticker: true, sector: true } })).map((i) => [i.id, i])
  );

  const volume = (stats._sum.size_min ? Number(stats._sum.size_min) : 0) + (stats._sum.size_max ? Number(stats._sum.size_max) : 0);

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
  const chartPoints: PoliticianChartPoint[] = Array.from(chartMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, v]) => ({
      period,
      buyVolume: v.buyVolume,
      sellVolume: v.sellVolume,
      sp500Close: sp500Quarterly.get(period) ?? null,
    }));

  return {
    politician,
    totalTrades,
    totalVolume: volume / 2,
    maxTrade: stats._max.size_max ? Number(stats._max.size_max) : 0,
    lastTraded: (() => {
      const ta = stats._max.traded_at;
      const pa = stats._max.published_at;
      const t = ta?.getTime() ?? 0;
      const p = pa?.getTime() ?? 0;
      if (!t && !p) return null;
      return new Date(Math.max(t, p || 0));
    })(),
    trades,
    chartPoints,
    topIssuers: topIssuers.map((i) => ({
      issuerId: i.issuer_id,
      count: i._count.issuer_id,
      name: issuerMap.get(i.issuer_id)?.name || 'Unknown',
      ticker: issuerMap.get(i.issuer_id)?.ticker || null,
      sector: sectorToZh(issuerMap.get(i.issuer_id)?.sector) || null,
    })),
  };
}
