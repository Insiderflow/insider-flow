import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  isOpenInsiderBuy,
  isOpenInsiderSell,
  openInsiderTradeValue,
} from '@/lib/openInsiderTransaction';
import { politicianTradeSeatLabel } from '@/lib/mobile/politicianSeatLabel';
import {
  isEtCalendarDay,
  politicianPublishedRange,
  politicianPublishedWhere,
  politicianTradeWhere,
  politicianTradedAtRange,
} from '@/lib/mobile/tradeDateSanity';
import { getPoliticianImageSrc } from '@/lib/politicianImageMapping';
import {
  accumulateSectorFlows,
  buildIndustryChainNodes,
} from '@/lib/industryChainBuilder';
import { normalizeGicsSectorKey } from '@/lib/industrySubsectorTaxonomy';
import { resolveIssuerTradeSector } from '@/lib/seatSector';
import {
  getInsiderDailyTradeBrief,
  getPoliticianDailyTradeBrief,
  type BriefLocale,
} from '@/lib/mobile/dailyTradeBrief';
import {
  computePoliticianTradeFlags,
  fetchCongressClusterKeys,
} from '@/lib/mobile/tradeFlags';
import { buildCommitteeSectorSummary } from '@/lib/mobile/committeeSectorBuilder';

export type MobilePeriod = '1D' | '7D' | '30D' | '90D';

function periodStart(period: MobilePeriod): Date {
  const d = new Date();
  if (period === '1D') d.setDate(d.getDate() - 1);
  else if (period === '7D') d.setDate(d.getDate() - 7);
  else if (period === '90D') d.setDate(d.getDate() - 90);
  else d.setDate(d.getDate() - 30);
  return d;
}

function previousPeriodRange(period: MobilePeriod): { start: Date; end: Date } {
  const end = periodStart(period);
  const start = new Date(end);
  if (period === '1D') {
    start.setDate(start.getDate() - 1);
    end.setTime(start.getTime());
  } else if (period === '7D') {
    start.setDate(start.getDate() - 7);
  } else if (period === '90D') {
    start.setDate(start.getDate() - 90);
  } else {
    start.setDate(start.getDate() - 30);
  }
  return { start, end };
}

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

function genSpike(seed: number, len = 12, bias: 'up' | 'down' | 'mixed' = 'up'): number[] {
  const arr: number[] = [];
  let v = 0.3 + (seed % 7) * 0.05;
  for (let i = 0; i < len; i++) {
    const noise = Math.sin(seed * 12.9898 + i * 78.233) * 0.5 + 0.5;
    const drift =
      bias === 'up' ? 0.04 : bias === 'down' ? -0.04 : i % 2 === 0 ? 0.03 : -0.03;
    v = Math.max(0.08, Math.min(1, v + drift * noise));
    arr.push(Number(v.toFixed(3)));
  }
  return arr;
}

function partyCode(raw: string | null | undefined): 'R' | 'D' | 'I' {
  const p = (raw || '').toLowerCase();
  if (p.startsWith('r') || p.includes('republican')) return 'R';
  if (p.startsWith('d') || p.includes('democrat')) return 'D';
  return 'I';
}

function tradeAmount(sizeMin: unknown, sizeMax: unknown): number {
  const max = Number(sizeMax || 0);
  const min = Number(sizeMin || 0);
  if (max > 0) return max;
  if (min > 0) return min;
  return 0;
}

function isSellType(type: string) {
  return type.toLowerCase().includes('sell');
}

function politicianPreviousPublishedWhere(period: MobilePeriod): Prisma.TradeWhereInput {
  const prev = previousPeriodRange(period);
  return {
    OR: [
      {
        published_at: {
          gte: prev.start,
          lt: prev.end,
          lte: politicianPublishedRange().lte,
        },
      },
      {
        published_at: null,
        traded_at: {
          gte: prev.start,
          lt: prev.end,
          lte: politicianTradedAtRange().lte,
        },
      },
    ],
  };
}

function tradeTypeCountWhere(
  base: Prisma.TradeWhereInput,
  kind: 'buy' | 'sell' | 'option' | 'proposed',
): Prisma.TradeWhereInput {
  const typeClause: Prisma.TradeWhereInput =
    kind === 'sell'
      ? { type: { contains: 'sell', mode: 'insensitive' } }
      : kind === 'buy'
        ? { NOT: { type: { contains: 'sell', mode: 'insensitive' } } }
        : kind === 'option'
          ? { type: { contains: 'option', mode: 'insensitive' } }
          : { type: { contains: 'proposed', mode: 'insensitive' } };
  return { AND: [base, typeClause] };
}

async function countPoliticianTrades(
  base: Prisma.TradeWhereInput,
  kind: 'buy' | 'sell' | 'option' | 'proposed',
): Promise<number> {
  return prisma.trade.count({ where: tradeTypeCountWhere(base, kind) });
}

async function countInsiderSides(since: Date, prev: { start: Date; end: Date }) {
  const tally = (groups: { transactionType: string; _count: { _all: number } }[]) => {
    let buys = 0;
    let sells = 0;
    let options = 0;
    for (const group of groups) {
      const count = group._count._all;
      const t = group.transactionType.toLowerCase();
      if (t.includes('option')) options += count;
      if (isOpenInsiderSell(group.transactionType)) sells += count;
      else if (isOpenInsiderBuy(group.transactionType)) buys += count;
    }
    return { buys, sells, options };
  };

  const [currentGroups, previousGroups] = await Promise.all([
    prisma.openInsiderTransaction.groupBy({
      by: ['transactionType'],
      where: { transactionDate: { gte: since } },
      _count: { _all: true },
    }),
    prisma.openInsiderTransaction.groupBy({
      by: ['transactionType'],
      where: { transactionDate: { gte: prev.start, lt: prev.end } },
      _count: { _all: true },
    }),
  ]);

  return { current: tally(currentGroups), previous: tally(previousGroups) };
}

type TradeRow = Awaited<
  ReturnType<typeof prisma.trade.findMany<{ include: { Politician: true; Issuer: true } }>>
>[number];

function tradeSide(row: TradeRow): 'buy' | 'sell' | 'proposed_sale' {
  if (isSellType(row.type)) {
    return row.type.toLowerCase().includes('proposed') ? 'proposed_sale' : 'sell';
  }
  return 'buy';
}

function disclosureDate(r: { published_at: Date | null; traded_at: Date }): Date {
  return r.published_at ?? r.traded_at;
}

function flagsForPoliticianRow(
  r: TradeRow,
  side: 'buy' | 'sell' | 'proposed_sale',
  clusterKeys: Set<string>,
) {
  const amountUsd = tradeAmount(r.size_min, r.size_max);
  return computePoliticianTradeFlags(
    {
      id: r.id,
      politicianId: r.politician_id,
      ticker: r.Issuer?.ticker,
      side,
      amountUsd,
      committees: r.Politician?.committees,
      issuerSector: r.Issuer?.sector,
    },
    clusterKeys,
  );
}

function mapPoliticianTradeHighlight(
  r: TradeRow,
  side: 'buy' | 'sell' | 'proposed_sale',
  i: number,
  clusterKeys: Set<string>,
) {
  const seat = politicianTradeSeatLabel({
    politicianId: r.politician_id,
    committees: r.Politician?.committees,
    tradeTicker: r.Issuer?.ticker,
    issuerSector: r.Issuer?.sector,
  });
  return {
    id: r.id,
    politicianId: r.politician_id || undefined,
    name: r.Politician?.name || '',
    title: seat.title,
    titleKey: seat.titleKey,
    party: partyCode(r.Politician?.party),
    state: r.Politician?.state || '',
    ticker: r.Issuer?.ticker || '',
    issuer: r.Issuer?.name || '',
    amount: tradeAmount(r.size_min, r.size_max),
    shares: 0,
    tradeDate: r.traded_at.toISOString().slice(0, 10),
    filedAt: disclosureDate(r).toISOString().slice(0, 10),
    side,
    flags: flagsForPoliticianRow(r, side, clusterKeys),
    imageUrl: r.politician_id
      ? getPoliticianImageSrc(r.politician_id, r.Politician?.name || '')
      : undefined,
    spike: genSpike(30 + i, 12, side === 'buy' ? 'up' : 'down'),
  };
}

export async function buildPoliticianMobileDashboard(
  period: MobilePeriod,
  locale: BriefLocale = 'zh-Hant',
) {
  const since = periodStart(period);
  const periodWhere = politicianPublishedWhere(since);
  const prevWhere = politicianPreviousPublishedWhere(period);
  const todayLookback = new Date();
  todayLookback.setDate(todayLookback.getDate() - 2);

  const briefOptions = { allowLlm: false as const };

  const [
    rows,
    recentForToday,
    buysCount,
    sellsCount,
    optionsCount,
    proposedCount,
    prevBuys,
    prevSells,
    prevOptions,
    prevProposed,
    clusterKeys,
    latestDisclosure,
    dailyBrief,
  ] = await Promise.all([
    prisma.trade.findMany({
      where: periodWhere,
      include: { Politician: true, Issuer: true },
      orderBy: { published_at: 'desc' },
      take: 300,
    }),
    prisma.trade.findMany({
      where: politicianPublishedWhere(todayLookback),
      include: { Politician: true, Issuer: true },
      orderBy: { published_at: 'desc' },
      take: 80,
    }),
    countPoliticianTrades(periodWhere, 'buy'),
    countPoliticianTrades(periodWhere, 'sell'),
    countPoliticianTrades(periodWhere, 'option'),
    countPoliticianTrades(periodWhere, 'proposed'),
    countPoliticianTrades(prevWhere, 'buy'),
    countPoliticianTrades(prevWhere, 'sell'),
    countPoliticianTrades(prevWhere, 'option'),
    countPoliticianTrades(prevWhere, 'proposed'),
    fetchCongressClusterKeys(prisma, politicianTradeWhere()),
    prisma.trade.aggregate({
      _max: { published_at: true },
    }),
    getPoliticianDailyTradeBrief(locale, period, briefOptions),
  ]);

  const todaysRows = recentForToday.filter((r) => isEtCalendarDay(disclosureDate(r)));

  const issuerFlow = new Map<string, { buy: number; sell: number }>();
  for (const row of rows) {
    const ticker = row.Issuer?.ticker;
    if (!ticker) continue;
    const cur = issuerFlow.get(ticker) || { buy: 0, sell: 0 };
    const amt = tradeAmount(row.size_min, row.size_max);
    if (isSellType(row.type)) cur.sell += amt;
    else cur.buy += amt;
    issuerFlow.set(ticker, cur);
  }

  const highlightFrom = (side: 'buy' | 'sell' | 'proposed_sale', limit: number) =>
    rows
      .filter((r) => {
        const sell = isSellType(r.type);
        if (side === 'proposed_sale') return r.type.toLowerCase().includes('proposed');
        if (side === 'sell') return sell;
        return !sell && !r.type.toLowerCase().includes('proposed');
      })
      .sort(
        (a, b) =>
          tradeAmount(b.size_min, b.size_max) - tradeAmount(a.size_min, a.size_max),
      )
      .slice(0, limit)
      .map((r, i) => {
        const mapped = mapPoliticianTradeHighlight(r, side, i, clusterKeys);
        return { ...mapped, id: r.politician_id || r.id };
      });

  const todaysTrades = [...todaysRows]
    .sort(
      (a, b) =>
        tradeAmount(b.size_min, b.size_max) - tradeAmount(a.size_min, a.size_max),
    )
    .map((r, i) => mapPoliticianTradeHighlight(r, tradeSide(r), i, clusterKeys));

  const flowRows = rows.map((row) => {
    const amt = tradeAmount(row.size_min, row.size_max);
    const sell = isSellType(row.type);
    return {
      sector: row.Issuer?.sector || 'Other',
      subsectorSlug: row.Issuer?.sub_sector_slug ?? null,
      buy: sell ? 0 : amt,
      sell: sell ? amt : 0,
    };
  });
  const { sectorAgg, subsectorAgg } = accumulateSectorFlows(flowRows);

  const topIndustries = [...sectorAgg.entries()]
    .map(([nameKey, v]) => ({
      nameKey,
      name: nameKey,
      buyAmount: v.buy,
      sellAmount: v.sell,
    }))
    .sort((a, b) => b.buyAmount + b.sellAmount - (a.buyAmount + a.sellAmount))
    .slice(0, 6);

  const industryChain = buildIndustryChainNodes(sectorAgg, subsectorAgg, 6);

  const committeeSectors = buildCommitteeSectorSummary(
    rows.map((r) => ({
      politicianId: r.politician_id,
      committees: r.Politician?.committees,
      ticker: r.Issuer?.ticker,
      issuerSector: r.Issuer?.sector,
      type: r.type,
      amountUsd: tradeAmount(r.size_min, r.size_max),
    })),
  );

  const dataAsOf =
    (rows[0] ? disclosureDate(rows[0]).toISOString().slice(0, 10) : null) ||
    new Date().toISOString().slice(0, 10);

  const latestDisclosureAt =
    latestDisclosure._max.published_at?.toISOString() ?? null;
  const generatedAt = new Date().toISOString();

  return {
    meta: {
      dataAsOf,
      nextUpdateEt: '22:15',
      generatedAt,
      latestDisclosureAt: latestDisclosureAt ?? undefined,
    },
    aiSummary: {
      headline: dailyBrief.headline,
      narrative: dailyBrief.narrative,
      bullets: [],
      sentiment: dailyBrief.sentiment,
    },
    kpis: [
      {
        id: 'buys',
        label: 'Buys',
        value: buysCount,
        changePct: pctChange(buysCount, prevBuys),
        spike: genSpike(1, 14, 'up'),
      },
      {
        id: 'sells',
        label: 'Sells',
        value: sellsCount,
        changePct: pctChange(sellsCount, prevSells),
        spike: genSpike(2, 14, 'down'),
      },
      {
        id: 'options',
        label: 'Options',
        value: optionsCount,
        changePct: pctChange(optionsCount, prevOptions),
        spike: genSpike(3, 14, 'mixed'),
      },
      {
        id: 'pp_sale',
        label: 'PP Sale',
        value: proposedCount,
        changePct: pctChange(proposedCount, prevProposed),
        spike: genSpike(4, 14, 'up'),
      },
    ],
    clusterBuys: [],
    clusterSells: [],
    topPoliticianBuys: highlightFrom('buy', 3),
    topPoliticianSells: highlightFrom('sell', 3),
    todaysTrades,
    primeBrokers: [],
    industryChain,
    topIndustries,
    committeeSectors,
    recentTrades: rows.slice(0, 8).map((r) => {
      const side = tradeSide(r);
      return {
        id: r.id,
        politicianId: r.politician_id || undefined,
        politician: r.Politician?.name || '',
        party: partyCode(r.Politician?.party),
        ticker: r.Issuer?.ticker || '',
        side,
        amount: tradeAmount(r.size_min, r.size_max),
        filedAt: r.published_at?.toISOString().slice(0, 10) || r.traded_at.toISOString().slice(0, 10),
        filedAtKey: r.id,
        flags: flagsForPoliticianRow(r, side, clusterKeys),
      };
    }),
  };
}

export async function buildInsiderMobileDashboard(
  period: MobilePeriod,
  locale: BriefLocale = 'zh-Hant',
) {
  const since = periodStart(period);
  const prev = previousPeriodRange(period);

  const briefOptions = { allowLlm: false as const };

  const [rows, insiderCounts, dailyBrief] = await Promise.all([
    prisma.openInsiderTransaction.findMany({
      where: { transactionDate: { gte: since } },
      include: { company: true, owner: true },
      orderBy: { transactionDate: 'desc' },
      take: 300,
    }),
    countInsiderSides(since, prev),
    getInsiderDailyTradeBrief(locale, period, briefOptions),
  ]);

  const { buys: buysCount, sells: sellsCount, options: optionsCount } =
    insiderCounts.current;
  const { buys: prevBuys, sells: prevSells } = insiderCounts.previous;

  type TickerAgg = {
    ticker: string;
    companyName: string;
    insiders: Set<string>;
    trades: number;
    side: 'buy' | 'sell';
    spikeSeed: number;
  };

  const tickerFlow = new Map<string, { buy: number; sell: number }>();
  const byTicker = new Map<string, TickerAgg>();
  for (const row of rows) {
    const ticker = row.company?.ticker || '—';
    const side = isOpenInsiderSell(row.transactionType) ? 'sell' : 'buy';
    const key = `${ticker}:${side}`;
    const cur = byTicker.get(key) || {
      ticker,
      companyName: row.company?.name || ticker,
      insiders: new Set<string>(),
      trades: 0,
      side,
      spikeSeed: row.id.charCodeAt(0),
    };
    if (row.ownerId) cur.insiders.add(row.ownerId);
    cur.trades += 1;
    byTicker.set(key, cur);

    if (ticker !== '—') {
      const flow = tickerFlow.get(ticker) || { buy: 0, sell: 0 };
      const amt = openInsiderTradeValue(row.valueNumeric);
      if (isOpenInsiderSell(row.transactionType)) flow.sell += amt;
      else flow.buy += amt;
      tickerFlow.set(ticker, flow);
    }
  }

  const clusterFrom = (side: 'buy' | 'sell', limit: number) =>
    [...byTicker.values()]
      .filter((c) => c.side === side && c.ticker !== '—')
      .sort((a, b) => b.trades - a.trades)
      .slice(0, limit)
      .map((c, i) => ({
        id: `cc-${c.ticker}`,
        ticker: c.ticker,
        companyName: c.companyName.slice(0, 18).toUpperCase(),
        logoColor: '#166534',
        insiders: c.insiders.size,
        trades: c.trades,
        side,
        spike: genSpike(c.spikeSeed + i, 14, side === 'buy' ? 'up' : 'down'),
      }));

  const highlightFrom = (side: 'buy' | 'sell', limit: number) =>
    rows
      .filter((r) =>
        side === 'sell'
          ? isOpenInsiderSell(r.transactionType)
          : isOpenInsiderBuy(r.transactionType)
      )
      .sort(
        (a, b) =>
          openInsiderTradeValue(b.valueNumeric) - openInsiderTradeValue(a.valueNumeric),
      )
      .slice(0, limit)
      .map((r, i) => ({
        id: r.ownerId ? `person-${r.ownerId}` : r.id,
        entityType: (r.owner?.name || '').length > 0 && (r.owner?.title || '').toLowerCase().includes('10%')
          ? ('company' as const)
          : ('person' as const),
        name: r.owner?.name || r.company?.name || '',
        subtitle: `${r.owner?.title || 'Insider'} • ${r.company?.ticker || ''}`,
        ticker: r.company?.ticker || '',
        amount: openInsiderTradeValue(r.valueNumeric),
        shares: Number(String(r.quantity).replace(/[^0-9.-]/g, '') || 0),
        side,
        spike: genSpike(100 + i, 12, side === 'buy' ? 'up' : 'down'),
      }));

  const dataAsOf =
    rows[0]?.transactionDate.toISOString().slice(0, 10) ||
    new Date().toISOString().slice(0, 10);

  const tickers = [
    ...new Set(
      rows
        .map((r) => r.company?.ticker?.trim().toUpperCase())
        .filter((t): t is string => Boolean(t)),
    ),
  ];
  const issuers =
    tickers.length > 0
      ? await prisma.issuer.findMany({
          where: { ticker: { in: tickers } },
          select: { ticker: true, sector: true, sub_sector_slug: true },
        })
      : [];
  const issuerByTicker = new Map(
    issuers
      .filter((i) => i.ticker)
      .map((i) => [i.ticker!.toUpperCase(), i]),
  );
  const sectorStats = new Map<
    string,
    { buy: number; sell: number; buyCount: number; sellCount: number }
  >();
  const flowRows = rows.map((row) => {
    const ticker = row.company?.ticker?.trim().toUpperCase();
    const issuer = ticker ? issuerByTicker.get(ticker) : undefined;
    const sector = normalizeGicsSectorKey(
      issuer?.sector ||
        resolveIssuerTradeSector(ticker, null) ||
        'Other',
    );
    const amt = openInsiderTradeValue(row.valueNumeric);
    const sell = isOpenInsiderSell(row.transactionType);
    const stats = sectorStats.get(sector) || {
      buy: 0,
      sell: 0,
      buyCount: 0,
      sellCount: 0,
    };
    if (sell) {
      stats.sell += amt;
      stats.sellCount += 1;
    } else {
      stats.buy += amt;
      stats.buyCount += 1;
    }
    sectorStats.set(sector, stats);
    return {
      sector,
      subsectorSlug: issuer?.sub_sector_slug ?? null,
      buy: sell ? 0 : amt,
      sell: sell ? amt : 0,
    };
  });
  const { sectorAgg, subsectorAgg } = accumulateSectorFlows(flowRows);

  const topIndustries = [...sectorStats.entries()]
    .map(([nameKey, v]) => ({
      nameKey,
      name: nameKey,
      buyAmount: v.buy,
      sellAmount: v.sell,
      buyCount: v.buyCount,
      sellCount: v.sellCount,
    }))
    .sort((a, b) => b.buyAmount + b.sellAmount - (a.buyAmount + a.sellAmount))
    .slice(0, 6);

  const industryChain = buildIndustryChainNodes(sectorAgg, subsectorAgg, 6, {
    syntheticSegments: true,
  });

  const buyHighlights = highlightFrom('buy', 8);
  const sellHighlights = highlightFrom('sell', 8);

  const latestFiling = await prisma.openInsiderTransaction.aggregate({
    _max: { transactionDate: true },
  });
  const latestFilingAt =
    latestFiling._max.transactionDate?.toISOString() ?? null;

  return {
    meta: {
      dataAsOf,
      nextUpdateEt: '22:15',
      generatedAt: new Date().toISOString(),
      latestFilingAt: latestFilingAt ?? undefined,
    },
    aiSummary: {
      headline: dailyBrief.headline,
      narrative: dailyBrief.narrative,
      bullets: [],
      sentiment: dailyBrief.sentiment,
    },
    kpis: [
      {
        id: 'buys',
        label: 'Buys',
        value: buysCount,
        changePct: pctChange(buysCount, prevBuys),
        spike: genSpike(11, 14, 'up'),
      },
      {
        id: 'sells',
        label: 'Sells',
        value: sellsCount,
        changePct: pctChange(sellsCount, prevSells),
        spike: genSpike(12, 14, 'down'),
      },
      {
        id: 'options',
        label: 'Options',
        value: optionsCount,
        changePct: 0,
        spike: genSpike(13, 14, 'mixed'),
      },
      { id: 'pp_sale', label: 'PP Sale', value: 0, changePct: 0, spike: genSpike(14, 14, 'up') },
    ],
    clusterBuys: [],
    clusterSells: [],
    topPoliticianBuys: [],
    topPoliticianSells: [],
    primeBrokers: [],
    industryChain,
    topIndustries,
    recentTrades: [],
    insiderExtras: {
      companyClustersBuy: clusterFrom('buy', 8),
      companyClustersSell: clusterFrom('sell', 8),
      highlightsBuy: buyHighlights,
      highlightsSell: sellHighlights,
    },
  };
}
