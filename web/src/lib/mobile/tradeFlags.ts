import type { Prisma, PrismaClient } from '@prisma/client';
import { explainCommitteeSectorAlignment } from '@/lib/seatSector';

/** Public codes returned to mobile clients (i18n keys: tradeFlags.*). */
export const TRADE_FLAG_CODES = [
  'notable_size',
  'committee_sector',
  'congress_cluster',
  /** Corporate Form 4: multiple insiders same ticker + side in window */
  'insider_cluster',
] as const;

export type TradeFlagCode = (typeof TRADE_FLAG_CODES)[number];

export const NOTABLE_SIZE_USD = 1_000_000;
export const CLUSTER_MIN_POLITICIANS = 3;
export const CLUSTER_WINDOW_DAYS = 7;

export type TradeSideFlag = 'buy' | 'sell' | 'proposed_sale';

export interface PoliticianTradeFlagInput {
  id: string;
  politicianId: string;
  ticker: string | null | undefined;
  side: TradeSideFlag;
  amountUsd: number;
  committees?: string | null;
  committeeAssignments?: unknown;
  issuerSector?: string | null;
  subSectorSlug?: string | null;
}

function clusterKey(ticker: string, side: TradeSideFlag): string {
  const normalized =
    side === 'proposed_sale' ? 'sell' : side;
  return `${ticker.toUpperCase()}|${normalized}`;
}

/** Keys `${TICKER}|buy|sell` where ≥ CLUSTER_MIN_POLITICIANS distinct members traded in the window. */
export function buildCongressClusterKeys(
  rows: {
    politicianId: string;
    ticker: string | null | undefined;
    side: TradeSideFlag;
  }[],
): Set<string> {
  const counts = new Map<string, Set<string>>();
  for (const row of rows) {
    const ticker = String(row.ticker || '').trim().toUpperCase();
    if (!ticker) continue;
    const key = clusterKey(ticker, row.side);
    if (!counts.has(key)) counts.set(key, new Set());
    counts.get(key)!.add(row.politicianId);
  }
  const hot = new Set<string>();
  for (const [key, politicians] of counts) {
    if (politicians.size >= CLUSTER_MIN_POLITICIANS) hot.add(key);
  }
  return hot;
}

/** `${TICKER}|buy|sell` → distinct politician count in the cluster window. */
export function buildCongressClusterCounts(
  rows: {
    politicianId: string;
    ticker: string | null | undefined;
    side: TradeSideFlag;
  }[],
): Map<string, number> {
  const counts = new Map<string, Set<string>>();
  for (const row of rows) {
    const ticker = String(row.ticker || '').trim().toUpperCase();
    if (!ticker) continue;
    const key = clusterKey(ticker, row.side);
    if (!counts.has(key)) counts.set(key, new Set());
    counts.get(key)!.add(row.politicianId);
  }
  const sizes = new Map<string, number>();
  for (const [key, politicians] of counts) {
    sizes.set(key, politicians.size);
  }
  return sizes;
}

export function isCommitteeSectorTrade(input: {
  politicianId: string;
  committees?: string | null;
  committeeAssignments?: unknown;
  ticker?: string | null;
  issuerSector?: string | null;
  subSectorSlug?: string | null;
}): boolean {
  return explainCommitteeSectorAlignment(input).met;
}

export function computePoliticianTradeFlags(
  input: PoliticianTradeFlagInput,
  clusterKeys: Set<string>,
): TradeFlagCode[] {
  const flags: TradeFlagCode[] = [];
  const ticker = String(input.ticker || '').trim().toUpperCase();

  if (input.amountUsd >= NOTABLE_SIZE_USD) {
    flags.push('notable_size');
  }

  if (
    isCommitteeSectorTrade({
      politicianId: input.politicianId,
      committees: input.committees,
      committeeAssignments: input.committeeAssignments,
      ticker: input.ticker,
      issuerSector: input.issuerSector,
      subSectorSlug: input.subSectorSlug,
    })
  ) {
    flags.push('committee_sector');
  }

  if (ticker && clusterKeys.has(clusterKey(ticker, input.side))) {
    flags.push('congress_cluster');
  }

  return flags;
}

export function computeInsiderNotableFlags(amountUsd: number): TradeFlagCode[] {
  return amountUsd >= NOTABLE_SIZE_USD ? ['notable_size'] : [];
}

function mapClusterRows(
  rows: Array<{
    politician_id: string;
    type: string;
    Issuer: { ticker: string | null } | null;
  }>,
) {
  return rows.map((r) => {
    const t = r.type.toLowerCase();
    const proposed = t.includes('proposed');
    const sell = t.includes('sell');
    const side: TradeSideFlag = proposed ? 'proposed_sale' : sell ? 'sell' : 'buy';
    return {
      politicianId: r.politician_id,
      ticker: r.Issuer?.ticker,
      side,
    };
  });
}

export async function fetchCongressClusterKeys(
  prisma: Pick<PrismaClient, 'trade'>,
  tradeWhere: Prisma.TradeWhereInput,
): Promise<Set<string>> {
  const { keys } = await fetchCongressClusterMeta(prisma, tradeWhere);
  return keys;
}

export async function fetchCongressClusterCounts(
  prisma: Pick<PrismaClient, 'trade'>,
  tradeWhere: Prisma.TradeWhereInput,
): Promise<Map<string, number>> {
  const { counts } = await fetchCongressClusterMeta(prisma, tradeWhere);
  return counts;
}

/** Single query for cluster keys + counts (7-day window). */
export async function fetchCongressClusterMeta(
  prisma: Pick<PrismaClient, 'trade'>,
  tradeWhere: Prisma.TradeWhereInput,
): Promise<{ keys: Set<string>; counts: Map<string, number> }> {
  const since = new Date();
  since.setDate(since.getDate() - CLUSTER_WINDOW_DAYS);

  const rows = await prisma.trade.findMany({
    where: {
      ...tradeWhere,
      traded_at: { gte: since },
    },
    select: {
      politician_id: true,
      type: true,
      Issuer: { select: { ticker: true } },
    },
  });

  const mapped = mapClusterRows(rows);
  return {
    keys: buildCongressClusterKeys(mapped),
    counts: buildCongressClusterCounts(mapped),
  };
}

export function clusterKeyForTrade(ticker: string, side: TradeSideFlag): string {
  return clusterKey(ticker, side);
}
