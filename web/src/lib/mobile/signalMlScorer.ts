import type { PrismaClient } from '@prisma/client';
import type { TradeFlagCode } from '@/lib/mobile/tradeFlags';

/** Explainable feature weights (v1 — no external model service). */
const W = {
  flags: 40,
  sizePercentile: 25,
  cluster: 20,
  recency: 10,
  lateFiling: 5,
} as const;

export type MlSignalTier = 'high' | 'medium' | 'low';

export type MlReasonCode =
  | 'unusual_size'
  | 'congress_cluster'
  | 'committee_sector'
  | 'notable_size'
  | 'recent_filing'
  | 'late_disclosure';

export type MlScoreInput = {
  flagScore: number;
  flags: TradeFlagCode[];
  sizePercentile: number;
  clusterSize: number;
  daysSincePublished: number;
  filedAfterDays: number | null;
};

export type MlScoreResult = {
  mlScore: number;
  mlTier: MlSignalTier;
  mlReasons: MlReasonCode[];
  breakdown: MlScoreBreakdown;
};

export type MlScoreBreakdown = {
  flags: number;
  size: number;
  cluster: number;
  recency: number;
  late: number;
};

function scoreParts(input: MlScoreInput): MlScoreBreakdown {
  const flagPart = Math.min(W.flags, (input.flagScore / 55) * W.flags);

  let sizePart = 0;
  if (input.sizePercentile >= 0.85) {
    sizePart = W.sizePercentile;
  } else if (input.sizePercentile >= 0.65) {
    sizePart = W.sizePercentile * 0.55;
  } else {
    sizePart = input.sizePercentile * W.sizePercentile * 0.35;
  }

  let clusterPart = 0;
  if (input.clusterSize >= 3) {
    clusterPart = Math.min(
      W.cluster,
      Math.max(0, (input.clusterSize - 2) * (W.cluster / 4)),
    );
  }

  const recencyPart =
    input.daysSincePublished <= 1
      ? W.recency
      : input.daysSincePublished <= 3
        ? W.recency * 0.7
        : input.daysSincePublished <= 7
          ? W.recency * 0.4
          : 0;

  let latePart = 0;
  if (input.filedAfterDays != null && input.filedAfterDays >= 45) {
    latePart = W.lateFiling;
  }

  return {
    flags: Math.round(flagPart),
    size: Math.round(sizePart),
    cluster: Math.round(clusterPart),
    recency: Math.round(recencyPart),
    late: Math.round(latePart),
  };
}

export function computeMlSignalScore(input: MlScoreInput): MlScoreResult {
  const reasons: MlReasonCode[] = [];
  const breakdown = scoreParts(input);

  if (input.flags.includes('congress_cluster')) reasons.push('congress_cluster');
  if (input.flags.includes('insider_cluster')) reasons.push('congress_cluster');
  if (input.flags.includes('committee_sector')) reasons.push('committee_sector');
  if (input.flags.includes('notable_size')) reasons.push('notable_size');

  if (input.sizePercentile >= 0.85) {
    reasons.push('unusual_size');
  }

  if (breakdown.recency >= W.recency * 0.4) reasons.push('recent_filing');

  if (input.filedAfterDays != null && input.filedAfterDays >= 45) {
    reasons.push('late_disclosure');
  }

  const raw =
    breakdown.flags +
    breakdown.size +
    breakdown.cluster +
    breakdown.recency +
    breakdown.late;
  const mlScore = Math.round(Math.min(100, Math.max(0, raw)));

  const mlTier: MlSignalTier =
    mlScore >= 70 ? 'high' : mlScore >= 45 ? 'medium' : 'low';

  return { mlScore, mlTier, mlReasons: [...new Set(reasons)], breakdown };
}

export function tradeAmountPercentile(
  amountUsd: number,
  politicianAmounts: number[],
): number {
  if (!Number.isFinite(amountUsd) || amountUsd <= 0) return 0;
  if (!politicianAmounts.length) return 0.5;
  const sorted = [...politicianAmounts].sort((a, b) => a - b);
  let below = 0;
  for (const v of sorted) {
    if (v <= amountUsd) below += 1;
  }
  return below / sorted.length;
}

export async function buildPoliticianAmountHistories(
  prisma: Pick<PrismaClient, 'trade'>,
  politicianIds: string[],
  lookbackDays = 365,
): Promise<Map<string, number[]>> {
  const map = new Map<string, number[]>();
  if (!politicianIds.length) return map;

  const since = new Date();
  since.setDate(since.getDate() - lookbackDays);

  const rows = await prisma.trade.findMany({
    where: {
      politician_id: { in: politicianIds },
      traded_at: { gte: since },
    },
    select: { politician_id: true, size_min: true, size_max: true },
  });

  for (const r of rows) {
    const max = Number(r.size_max || 0);
    const min = Number(r.size_min || 0);
    const amount = max > 0 ? max : min;
    if (amount <= 0) continue;
    const list = map.get(r.politician_id) || [];
    list.push(amount);
    map.set(r.politician_id, list);
  }

  return map;
}
