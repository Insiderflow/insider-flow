import { prisma } from '@/lib/prisma';
import { getPoliticianImageSrc } from '@/lib/politicianImageMapping';
import {
  isOpenInsiderBuy,
  isOpenInsiderSell,
  openInsiderMarketSide,
} from '@/lib/openInsiderTransaction';
import {
  buildPoliticianAmountHistories,
  computeMlSignalScore,
  tradeAmountPercentile,
  type MlScoreBreakdown,
} from '@/lib/mobile/signalMlScorer';
import type { BriefLocale } from '@/lib/mobile/dailyTradeBrief';
import {
  clusterKeyForTrade,
  computeInsiderNotableFlags,
  computePoliticianTradeFlags,
  fetchCongressClusterMeta,
  NOTABLE_SIZE_USD,
  CLUSTER_MIN_POLITICIANS,
  CLUSTER_WINDOW_DAYS,
  type TradeSideFlag,
} from '@/lib/mobile/tradeFlags';
import { explainCommitteeSectorAlignment } from '@/lib/seatSector';
import { politicianTradeWhere } from '@/lib/mobile/tradeDateSanity';
import type { MobileSignalItem } from '@/lib/mobile/signalsBuilder';
import { computeSignalRecommendation } from '@/lib/mobile/signalRecommendation';

export type SignalCriterionId =
  | 'notable_size'
  | 'committee_sector'
  | 'congress_cluster'
  | 'insider_cluster'
  | 'unusual_size'
  | 'recent_filing'
  | 'late_disclosure';

export type SignalCriterionRow = {
  id: SignalCriterionId;
  met: boolean;
  applicable: boolean;
  detail: string | null;
};

export type MobileSignalDetailPayload = {
  signal: MobileSignalItem;
  criteria: SignalCriterionRow[];
  thresholds: {
    notableSizeUsd: number;
    clusterMinMembers: number;
    clusterWindowDays: number;
    unusualSizePercentile: number;
    lateFilingDays: number;
  };
  clusterSize: number;
  sizePercentile: number;
  scoreBreakdown: MlScoreBreakdown;
  /** Other flagged peers on same ticker + side in the cluster window. */
  sameTickerCount: number;
};

function parseSignalId(
  signalId: string,
): { feed: 'politician' | 'corporate'; tradeId: string } | null {
  if (signalId.startsWith('signal-oi-')) {
    return { feed: 'corporate', tradeId: signalId.slice('signal-oi-'.length) };
  }
  if (signalId.startsWith('signal-')) {
    return { feed: 'politician', tradeId: signalId.slice('signal-'.length) };
  }
  return null;
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

function signalScore(flags: string[]): number {
  let score = flags.length * 10;
  if (flags.includes('congress_cluster')) score += 30;
  if (flags.includes('insider_cluster')) score += 28;
  if (flags.includes('committee_sector')) score += 20;
  if (flags.includes('notable_size')) score += 15;
  return score;
}

function formatUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${Math.round(n).toLocaleString()}`;
}

function insiderSizePercentile(amountUsd: number): number {
  if (amountUsd >= 10_000_000) return 0.97;
  if (amountUsd >= 5_000_000) return 0.88;
  if (amountUsd >= NOTABLE_SIZE_USD) return 0.78;
  return 0.5;
}

const THRESHOLDS = {
  notableSizeUsd: NOTABLE_SIZE_USD,
  clusterMinMembers: CLUSTER_MIN_POLITICIANS,
  clusterWindowDays: CLUSTER_WINDOW_DAYS,
  unusualSizePercentile: 0.85,
  lateFilingDays: 45,
};

function detailNotable(locale: BriefLocale, amount: number): string {
  const amt = formatUsd(amount);
  const thr = formatUsd(NOTABLE_SIZE_USD);
  if (locale === 'en') return `${amt} (threshold ${thr})`;
  if (locale === 'zh-Hans') return `${amt}（门槛 ${thr}）`;
  if (locale === 'ko') return `${amt}（기준 ${thr}）`;
  return `${amt}（門檻 ${thr}）`;
}

function detailCluster(
  locale: BriefLocale,
  size: number,
  ticker: string,
  side: TradeSideFlag,
): string {
  const sideLabel =
    side === 'buy'
      ? locale === 'en'
        ? 'buy'
        : locale === 'ko'
          ? '매수'
          : '買入'
      : locale === 'en'
        ? 'sell'
        : locale === 'ko'
          ? '매도'
          : '賣出';
  if (locale === 'en') {
    return `${size} members · ${ticker} ${sideLabel} · ${CLUSTER_WINDOW_DAYS}d`;
  }
  if (locale === 'ko') {
    return `${size}명 · ${ticker} ${sideLabel} · ${CLUSTER_WINDOW_DAYS}일`;
  }
  return `${size} 人 · ${ticker} ${sideLabel} · ${CLUSTER_WINDOW_DAYS} 日`;
}

function detailPercentile(locale: BriefLocale, p: number): string {
  const pct = Math.round(p * 100);
  if (locale === 'en') return `${pct}th percentile vs this member's history`;
  if (locale === 'zh-Hans') return `为该申报人历史金额的 P${pct}`;
  if (locale === 'ko') return `해당 신고인 과거 금액 대비 P${pct}`;
  return `為該申報人歷史金額的 P${pct}`;
}

function detailDays(locale: BriefLocale, days: number, kind: 'recent' | 'late'): string {
  if (kind === 'recent') {
    if (locale === 'en') return `Disclosed ${days.toFixed(0)} day(s) ago`;
    if (locale === 'ko') return `${days.toFixed(0)}일 전 공시`;
    return `距今 ${days.toFixed(0)} 日內申報`;
  }
  if (locale === 'en') return `Filed ${days} days after trade`;
  if (locale === 'ko') return `거래 후 ${days}일 만에 신고`;
  return `交易後 ${days} 日才申報`;
}

function committeeAlignmentDetail(
  locale: BriefLocale,
  align: ReturnType<typeof explainCommitteeSectorAlignment>,
): string {
  if (!align.committees) {
    if (locale === 'en') return 'No committee membership on file';
    if (locale === 'zh-Hans') return '无委员会任职数据';
    if (locale === 'ko') return '위원회 임명 정보 없음';
    return '無委員會任職資料';
  }
  if (align.usedGovtrackMap && align.committeeCodes.length) {
    const codes = align.committeeCodes.slice(0, 4).join(', ');
    const seats = align.committeeSectors.join(locale === 'en' || locale === 'ko' ? ', ' : '、');
    if (locale === 'en') {
      return `GovTrack: ${codes} → ${seats || 'no sector map'}`;
    }
    if (locale === 'ko') {
      return `GovTrack: ${codes} → ${seats || '섹터 매핑 없음'}`;
    }
    return `GovTrack：${codes} → ${seats || '無板塊對應'}`;
  }
  if (!align.committeeSectors.length) {
    const names = align.committeeNames.slice(0, 2).join(locale === 'en' || locale === 'ko' ? '; ' : '；');
    if (locale === 'en') {
      return names
        ? `Committees: ${names} — could not map to GICS sector`
        : 'Committee text present but no sector mapping';
    }
    if (locale === 'ko') {
      return names
        ? `위원회: ${names} — GICS 섹터 매핑 불가`
        : '위원회 정보는 있으나 섹터 매핑 없음';
    }
    return names ? `委員會：${names} — 未能對應 GICS 板塊` : '有委員會文字但無法對應板塊';
  }
  if (!align.tradeSector) {
    const seats = align.committeeSectors.join(locale === 'en' || locale === 'ko' ? ', ' : '、');
    if (locale === 'en') return `Committee sectors: ${seats}; issuer sector unknown`;
    if (locale === 'ko') return `위원회 섹터: ${seats}; 발행사 섹터 미확인`;
    return `委員會板塊：${seats}；標的板塊未知`;
  }
  const seats = align.committeeSectors.join(locale === 'en' || locale === 'ko' ? ', ' : '、');
  if (align.met) {
    if (locale === 'en') {
      return `Match: trade ${align.tradeSector} ∈ committee sectors (${seats})`;
    }
    if (locale === 'ko') {
      return `일치: 거래 ${align.tradeSector} ∈ 위원회 섹터（${seats}）`;
    }
    return `命中：標的 ${align.tradeSector} ∈ 委員會板塊（${seats}）`;
  }
  if (locale === 'en') {
    return `Committee sectors: ${seats}; trade sector: ${align.tradeSector}`;
  }
  if (locale === 'ko') {
    return `위원회 섹터: ${seats}; 거래 섹터: ${align.tradeSector}`;
  }
  return `委員會板塊：${seats}；標的板塊：${align.tradeSector}`;
}

function buildCriteriaRows(input: {
  locale: BriefLocale;
  feed: 'politician' | 'corporate';
  amountUsd: number;
  ticker: string;
  side: TradeSideFlag;
  flags: string[];
  politicianId: string;
  committees?: string | null;
  committeeAssignments?: unknown;
  issuerSector?: string | null;
  subSectorSlug?: string | null;
  clusterSize: number;
  sizePercentile: number;
  daysSincePublished: number;
  filedAfterDays: number | null;
  mlReasons: string[];
}): SignalCriterionRow[] {
  const {
    locale,
    feed,
    amountUsd,
    ticker,
    side,
    flags,
    politicianId,
    committees,
    committeeAssignments,
    issuerSector,
    subSectorSlug,
    clusterSize,
    sizePercentile,
    daysSincePublished,
    filedAfterDays,
    mlReasons,
  } = input;

  const notableMet = amountUsd >= NOTABLE_SIZE_USD;
  const committeeAlign =
    feed === 'politician'
      ? explainCommitteeSectorAlignment({
          politicianId,
          committees,
          committeeAssignments,
          ticker,
          issuerSector,
          subSectorSlug,
        })
      : null;
  const committeeMet = committeeAlign?.met ?? false;
  const clusterMet =
    feed === 'politician' &&
    flags.includes('congress_cluster');
  const insiderClusterMet = flags.includes('insider_cluster');
  const unusualMet = mlReasons.includes('unusual_size');
  const recentMet = mlReasons.includes('recent_filing');
  const lateMet = mlReasons.includes('late_disclosure');

  return [
    {
      id: 'notable_size',
      met: notableMet,
      applicable: true,
      detail: detailNotable(locale, amountUsd),
    },
    {
      id: 'committee_sector',
      met: committeeMet,
      applicable: feed === 'politician',
      detail: committeeAlign
        ? committeeAlignmentDetail(locale, committeeAlign)
        : locale === 'en'
          ? 'N/A for corporate signals'
          : locale === 'ko'
            ? '기업 신호에는 해당 없음'
            : '企業訊號不適用',
    },
    {
      id: 'congress_cluster',
      met: clusterMet,
      applicable: feed === 'politician',
      detail:
        clusterSize > 0
          ? detailCluster(locale, clusterSize, ticker, side)
          : locale === 'en'
            ? `Need ≥${CLUSTER_MIN_POLITICIANS} members same ticker & side`
            : locale === 'ko'
              ? `동일 종목·방향 의원 ≥${CLUSTER_MIN_POLITICIANS}명 필요`
              : `需 ≥${CLUSTER_MIN_POLITICIANS} 位議員同標的同向`,
    },
    {
      id: 'insider_cluster',
      met: insiderClusterMet,
      applicable: false,
      detail: null,
    },
    {
      id: 'unusual_size',
      met: unusualMet,
      applicable: true,
      detail: detailPercentile(locale, sizePercentile),
    },
    {
      id: 'recent_filing',
      met: recentMet,
      applicable: true,
      detail: detailDays(locale, daysSincePublished, 'recent'),
    },
    {
      id: 'late_disclosure',
      met: lateMet,
      applicable: filedAfterDays != null,
      detail:
        filedAfterDays != null
          ? detailDays(locale, filedAfterDays, 'late')
          : locale === 'en'
            ? 'No filing lag on record'
            : locale === 'ko'
              ? '지연 신고 기록 없음'
              : '無延遲申報紀錄',
    },
  ];
}

async function buildPoliticianSignalDetail(
  tradeId: string,
  locale: BriefLocale,
): Promise<MobileSignalDetailPayload | null> {
  const baseWhere = politicianTradeWhere();
  const r = await prisma.trade.findFirst({
    where: { id: tradeId, ...baseWhere },
    include: {
      Politician: true,
      Issuer: { include: { IndustrySubsector: true } },
    },
  });
  if (!r) return null;

  const sell = r.type.toLowerCase().includes('sell');
  const proposed = r.type.toLowerCase().includes('proposed');
  const side: TradeSideFlag = proposed ? 'proposed_sale' : sell ? 'sell' : 'buy';
  const amountUsd = tradeAmount(r.size_min, r.size_max);
  const ticker = r.Issuer?.ticker?.trim().toUpperCase() || '—';

  const [{ keys: clusterKeys, counts: clusterCounts }, amountHistories] =
    await Promise.all([
      fetchCongressClusterMeta(prisma, baseWhere),
      buildPoliticianAmountHistories(prisma, [r.politician_id]),
    ]);

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

  const publishedAt = r.published_at || r.traded_at;
  const now = Date.now();
  const daysSincePublished = Math.max(
    0,
    (now - publishedAt.getTime()) / (1000 * 60 * 60 * 24),
  );
  const clusterSize =
    ticker !== '—'
      ? clusterCounts.get(clusterKeyForTrade(ticker, side)) || 0
      : 0;
  const sizePercentile = tradeAmountPercentile(
    amountUsd,
    amountHistories.get(r.politician_id) || [],
  );
  const ruleScore = signalScore(flags);
  const ml = computeMlSignalScore({
    flagScore: ruleScore,
    flags,
    sizePercentile,
    clusterSize,
    daysSincePublished,
    filedAfterDays: r.filed_after_days,
  });

  const signal: MobileSignalItem = {
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
  };

  const criteria = buildCriteriaRows({
    locale,
    feed: 'politician',
    amountUsd,
    ticker,
    side,
    flags,
    politicianId: r.politician_id,
    committees: r.Politician?.committees,
    committeeAssignments: r.Politician?.committee_assignments,
    issuerSector: r.Issuer?.sector,
    subSectorSlug: r.Issuer?.sub_sector_slug,
    clusterSize,
    sizePercentile,
    daysSincePublished,
    filedAfterDays: r.filed_after_days,
    mlReasons: ml.mlReasons,
  });

  return {
    signal,
    criteria,
    thresholds: THRESHOLDS,
    clusterSize,
    sizePercentile,
    scoreBreakdown: ml.breakdown,
    sameTickerCount: Math.max(0, clusterSize - 1),
  };
}

async function countCorporateSameTickerPeers(
  ticker: string,
  side: TradeSideFlag,
  excludeId: string,
): Promise<number> {
  if (!ticker || ticker === '—') return 0;
  const since = new Date();
  since.setDate(since.getDate() - CLUSTER_WINDOW_DAYS);

  const rows = await prisma.openInsiderTransaction.findMany({
    where: {
      id: { not: excludeId },
      transactionDate: { gte: since },
      company: { ticker: { equals: ticker, mode: 'insensitive' } },
    },
    select: { transactionType: true },
  });

  return rows.filter((r) =>
    side === 'sell'
      ? isOpenInsiderSell(r.transactionType)
      : isOpenInsiderBuy(r.transactionType),
  ).length;
}

async function buildCorporateSignalDetail(
  tradeId: string,
  locale: BriefLocale,
): Promise<MobileSignalDetailPayload | null> {
  const r = await prisma.openInsiderTransaction.findFirst({
    where: { id: tradeId },
    include: { company: true, owner: true },
  });
  if (!r) return null;

  const amountUsd = Number(r.valueNumeric || 0);
  const flags = computeInsiderNotableFlags(amountUsd);
  const ticker = r.company?.ticker?.trim().toUpperCase() || '—';
  const side = openInsiderMarketSide(r.transactionType) ?? 'sell';
  const ruleScore = signalScore(flags);
  const daysSincePublished = Math.max(
    0,
    (Date.now() - r.transactionDate.getTime()) / (1000 * 60 * 60 * 24),
  );
  const sizePercentile = insiderSizePercentile(amountUsd);
  const ml = computeMlSignalScore({
    flagScore: ruleScore,
    flags,
    sizePercentile,
    clusterSize: 0,
    daysSincePublished,
    filedAfterDays: null,
  });

  const ownerName = r.owner?.name || r.company?.name || 'Insider';
  const sameTickerCount = await countCorporateSameTickerPeers(
    ticker,
    side,
    r.id,
  );

  const signal: MobileSignalItem = {
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
  };

  const criteria = buildCriteriaRows({
    locale,
    feed: 'corporate',
    amountUsd,
    ticker,
    side,
    flags,
    politicianId: r.ownerId || '',
    clusterSize: 0,
    sizePercentile,
    daysSincePublished,
    filedAfterDays: null,
    mlReasons: ml.mlReasons,
  });

  return {
    signal,
    criteria,
    thresholds: THRESHOLDS,
    clusterSize: 0,
    sizePercentile,
    scoreBreakdown: ml.breakdown,
    sameTickerCount,
  };
}

export async function buildSignalDetail(
  signalId: string,
  locale: BriefLocale = 'zh-Hant',
): Promise<MobileSignalDetailPayload | null> {
  const parsed = parseSignalId(signalId);
  if (!parsed) return null;
  return parsed.feed === 'politician'
    ? buildPoliticianSignalDetail(parsed.tradeId, locale)
    : buildCorporateSignalDetail(parsed.tradeId, locale);
}
