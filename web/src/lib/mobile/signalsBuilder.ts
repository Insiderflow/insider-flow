import { prisma } from '@/lib/prisma';
import { getPoliticianImageSrc } from '@/lib/politicianImageMapping';
import { openInsiderSide } from '@/lib/openInsiderTransaction';
import {
  buildPoliticianAmountHistories,
  computeMlSignalScore,
  tradeAmountPercentile,
} from '@/lib/mobile/signalMlScorer';
import {
  clusterKeyForTrade,
  computeInsiderNotableFlags,
  computePoliticianTradeFlags,
  fetchCongressClusterMeta,
  NOTABLE_SIZE_USD,
  type TradeFlagCode,
} from '@/lib/mobile/tradeFlags';
import { politicianPublishedWhere, politicianTradeWhere } from '@/lib/mobile/tradeDateSanity';
import type { BriefLocale } from '@/lib/mobile/dailyTradeBrief';
import type { MobilePeriod } from '@/lib/mobile/dashboardBuilder';
import {
  getSignalsBrief,
  type SignalsAiSummary,
} from '@/lib/mobile/signalsBriefBuilder';
import {
  computeSignalRecommendation,
  passesRecommendationFilter,
  type SignalRecommendation,
} from '@/lib/mobile/signalRecommendation';

export type SignalFeed = 'politician' | 'corporate' | 'all';
export type SignalItemFeed = 'politician' | 'corporate';
export type SignalTierFilter = 'all' | 'medium_plus' | 'high';
export type SignalSideFilter = 'all' | 'buy' | 'sell' | 'hold';
export type MlSignalTier = 'high' | 'medium' | 'low';

export function passesTierFilter(
  tier: SignalTierFilter,
  mlTier: MlSignalTier,
): boolean {
  if (tier === 'all') return true;
  if (tier === 'high') return mlTier === 'high';
  return mlTier === 'high' || mlTier === 'medium';
}

export function defaultTierForPeriod(period: MobilePeriod): SignalTierFilter {
  return period === '1D' ? 'medium_plus' : 'all';
}

export function defaultSignalsLimit(period: MobilePeriod): number {
  return period === '1D' ? 25 : 40;
}

export function passesSideFilter(
  recommendation: SignalRecommendation,
  sideFilter: SignalSideFilter,
): boolean {
  return passesRecommendationFilter(recommendation, sideFilter);
}

function filterBySide(
  signals: MobileSignalItem[],
  sideFilter: SignalSideFilter,
): MobileSignalItem[] {
  if (sideFilter === 'all') return signals;
  return signals.filter((s) => passesSideFilter(s.recommendation, sideFilter));
}

function filterByTier(
  signals: MobileSignalItem[],
  tier: SignalTierFilter,
): MobileSignalItem[] {
  if (tier === 'all') return signals;
  return signals.filter((s) => passesTierFilter(tier, s.mlTier));
}

function periodStart(period: MobilePeriod): Date {
  const d = new Date();
  if (period === '1D') d.setDate(d.getDate() - 1);
  else if (period === '7D') d.setDate(d.getDate() - 7);
  else if (period === '90D') d.setDate(d.getDate() - 90);
  else d.setDate(d.getDate() - 30);
  return d;
}

function tradeAmount(sizeMin: unknown, sizeMax: unknown): number {
  const max = Number(sizeMax || 0);
  const min = Number(sizeMin || 0);
  return max > 0 ? max : min;
}

function partyCode(raw: string | null | undefined): 'R' | 'D' | 'I' {
  const p = (raw || '').toLowerCase();
  if (p.startsWith('r')) return 'R';
  if (p.startsWith('d')) return 'D';
  return 'I';
}

function signalScore(flags: TradeFlagCode[]): number {
  let score = flags.length * 10;
  if (flags.includes('congress_cluster')) score += 30;
  if (flags.includes('insider_cluster')) score += 28;
  if (flags.includes('committee_sector')) score += 20;
  if (flags.includes('notable_size')) score += 15;
  return score;
}

export type MobileSignalItem = {
  id: string;
  tradeId: string;
  feed: SignalItemFeed;
  ticker: string;
  issuerName: string;
  politicianId: string;
  politicianName: string;
  party: 'R' | 'D' | 'I';
  side: 'buy' | 'sell' | 'proposed_sale';
  /** User-facing action hint (買/賣/持), derived from ML conviction — not raw filing side. */
  recommendation: SignalRecommendation;
  flags: TradeFlagCode[];
  amountUsd: number;
  filedAt: string;
  /** Rule-based score (flags only). */
  score: number;
  mlScore: number;
  mlTier: MlSignalTier;
  mlReasons: string[];
  imageUrl?: string;
  /** Corporate insider owner id (mobile: `/insider/person/person-{id}`). */
  ownerId?: string;
};

export type MobileSignalsPayload = {
  period: MobilePeriod;
  feed: SignalFeed;
  tierFilter: SignalTierFilter;
  sideFilter: SignalSideFilter;
  generatedAt: string;
  aiSummary?: SignalsAiSummary;
  signals: MobileSignalItem[];
};

function insiderSizePercentile(amountUsd: number): number {
  if (amountUsd >= 10_000_000) return 0.97;
  if (amountUsd >= 5_000_000) return 0.88;
  if (amountUsd >= NOTABLE_SIZE_USD) return 0.78;
  return 0.5;
}

function compareSignals(a: MobileSignalItem, b: MobileSignalItem): number {
  return (
    b.mlScore - a.mlScore ||
    b.score - a.score ||
    b.filedAt.localeCompare(a.filedAt)
  );
}

async function buildPoliticianSignals(
  period: MobilePeriod,
  take: number,
): Promise<MobileSignalItem[]> {
  const since = periodStart(period);
  const periodWhere = politicianPublishedWhere(since);
  const baseWhere = politicianTradeWhere();
  const scanLimit = Math.min(200, Math.max(take * 3, 60));

  const [rows, { keys: clusterKeys, counts: clusterCounts }] = await Promise.all([
    prisma.trade.findMany({
      where: periodWhere,
      include: {
        Politician: true,
        Issuer: { include: { IndustrySubsector: true } },
      },
      orderBy: { published_at: 'desc' },
      take: scanLimit,
    }),
    fetchCongressClusterMeta(prisma, baseWhere),
  ]);

  const politicianIds = [...new Set(rows.map((r) => r.politician_id))];
  const amountHistories = await buildPoliticianAmountHistories(
    prisma,
    politicianIds,
  );

  const now = Date.now();
  const signals: MobileSignalItem[] = [];

  for (const r of rows) {
    const sell = r.type.toLowerCase().includes('sell');
    const proposed = r.type.toLowerCase().includes('proposed');
    const side = proposed ? 'proposed_sale' : sell ? 'sell' : 'buy';
    const amountUsd = tradeAmount(r.size_min, r.size_max);
    const flags = computePoliticianTradeFlags(
      {
        id: r.id,
        politicianId: r.politician_id,
        ticker: r.Issuer?.ticker,
        side,
        amountUsd,
        committees: r.Politician?.committees,
        committeeAssignments: r.Politician?.committee_assignments,
        issuerSector: r.Issuer?.sector,
        subSectorSlug: r.Issuer?.sub_sector_slug,
      },
      clusterKeys,
    );
    if (!flags.length) continue;

    const ticker = r.Issuer?.ticker?.trim().toUpperCase() || '—';
    const publishedAt = r.published_at || r.traded_at;
    const daysSincePublished = Math.max(
      0,
      (now - publishedAt.getTime()) / (1000 * 60 * 60 * 24),
    );
    const clusterSize =
      ticker !== '—'
        ? clusterCounts.get(clusterKeyForTrade(ticker, side)) || 0
        : 0;
    const ruleScore = signalScore(flags);
    const ml = computeMlSignalScore({
      flagScore: ruleScore,
      flags,
      sizePercentile: tradeAmountPercentile(
        amountUsd,
        amountHistories.get(r.politician_id) || [],
      ),
      clusterSize,
      daysSincePublished,
      filedAfterDays: r.filed_after_days,
    });

    signals.push({
      id: `signal-${r.id}`,
      tradeId: r.id,
      feed: 'politician',
      ticker,
      issuerName: r.Issuer?.name || ticker,
      politicianId: r.politician_id,
      politicianName: r.Politician?.name || '',
      party: partyCode(r.Politician?.party),
      side,
      recommendation: computeSignalRecommendation({ side, mlTier: ml.mlTier }),
      flags,
      amountUsd,
      filedAt:
        r.published_at?.toISOString().slice(0, 10) ||
        r.traded_at.toISOString().slice(0, 10),
      score: ruleScore,
      mlScore: ml.mlScore,
      mlTier: ml.mlTier,
      mlReasons: ml.mlReasons,
      imageUrl: getPoliticianImageSrc(r.politician_id, r.Politician?.name || ''),
    });
  }

  signals.sort(compareSignals);
  return signals.slice(0, take);
}

async function buildCorporateSignals(
  period: MobilePeriod,
  take: number,
): Promise<MobileSignalItem[]> {
  const since = periodStart(period);
  const scanLimit = Math.min(200, Math.max(take * 3, 60));
  const rows = await prisma.openInsiderTransaction.findMany({
    where: { transactionDate: { gte: since } },
    include: { company: true, owner: true },
    orderBy: { transactionDate: 'desc' },
    take: scanLimit,
  });

  const now = Date.now();
  const signals: MobileSignalItem[] = [];

  for (const r of rows) {
    const amountUsd = Number(r.valueNumeric || 0);
    const flags = computeInsiderNotableFlags(amountUsd);
    if (!flags.length) continue;

    const ticker = r.company?.ticker?.trim().toUpperCase() || '—';
    const side = openInsiderSide(r.transactionType);
    const ruleScore = signalScore(flags);
    const daysSincePublished = Math.max(
      0,
      (now - r.transactionDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const ml = computeMlSignalScore({
      flagScore: ruleScore,
      flags,
      sizePercentile: insiderSizePercentile(amountUsd),
      clusterSize: 0,
      daysSincePublished,
      filedAfterDays: null,
    });

    const ownerName = r.owner?.name || r.company?.name || 'Insider';
    signals.push({
      id: `signal-oi-${r.id}`,
      tradeId: r.id,
      feed: 'corporate',
      ticker,
      issuerName: r.company?.name || ticker,
      politicianId: r.ownerId ? `person-${r.ownerId}` : '',
      politicianName: ownerName,
      party: 'I',
      side,
      recommendation: computeSignalRecommendation({ side, mlTier: ml.mlTier }),
      flags,
      amountUsd,
      filedAt: r.transactionDate.toISOString().slice(0, 10),
      score: ruleScore,
      mlScore: ml.mlScore,
      mlTier: ml.mlTier,
      mlReasons: ml.mlReasons,
      ownerId: r.ownerId || undefined,
    });
  }

  signals.sort(compareSignals);
  return signals.slice(0, take);
}

export async function buildFilteredSignals(
  period: MobilePeriod = '7D',
  limit = 40,
  feed: SignalFeed = 'all',
  tierFilter: SignalTierFilter = defaultTierForPeriod(period),
  sideFilter: SignalSideFilter = 'all',
): Promise<MobileSignalItem[]> {
  const poolSize =
    tierFilter === 'all' && sideFilter === 'all'
      ? feed === 'all'
        ? Math.max(limit, 80)
        : limit
      : Math.min(200, Math.max(limit * 4, 120));

  const [politicianSignals, corporateSignals] = await Promise.all([
    feed === 'corporate'
      ? Promise.resolve([])
      : buildPoliticianSignals(period, poolSize),
    feed === 'politician'
      ? Promise.resolve([])
      : buildCorporateSignals(period, poolSize),
  ]);

  const merged =
    feed === 'all'
      ? [...politicianSignals, ...corporateSignals].sort(compareSignals)
      : feed === 'politician'
        ? politicianSignals
        : corporateSignals;

  return filterBySide(
    filterByTier(merged, tierFilter),
    sideFilter,
  ).slice(0, limit);
}

export async function buildMobileSignals(
  period: MobilePeriod = '7D',
  limit = 40,
  feed: SignalFeed = 'all',
  locale: BriefLocale = 'zh-Hant',
  tierFilter: SignalTierFilter = defaultTierForPeriod(period),
  sideFilter: SignalSideFilter = 'all',
  options?: { includeBrief?: boolean },
): Promise<MobileSignalsPayload> {
  const filtered = await buildFilteredSignals(
    period,
    limit,
    feed,
    tierFilter,
    sideFilter,
  );

  const payload: MobileSignalsPayload = {
    period,
    feed,
    tierFilter,
    sideFilter,
    generatedAt: new Date().toISOString(),
    signals: filtered,
  };

  if (options?.includeBrief) {
    payload.aiSummary = await getSignalsBrief(
      filtered,
      period,
      feed,
      locale,
      tierFilter,
      sideFilter,
    );
  }

  return payload;
}

export async function buildMobileSignalsBrief(
  period: MobilePeriod = '7D',
  limit = 40,
  feed: SignalFeed = 'all',
  locale: BriefLocale = 'zh-Hant',
  tierFilter: SignalTierFilter = defaultTierForPeriod(period),
  sideFilter: SignalSideFilter = 'all',
): Promise<SignalsAiSummary> {
  const filtered = await buildFilteredSignals(
    period,
    limit,
    feed,
    tierFilter,
    sideFilter,
  );
  return getSignalsBrief(
    filtered,
    period,
    feed,
    locale,
    tierFilter,
    sideFilter,
  );
}
