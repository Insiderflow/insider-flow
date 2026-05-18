import {
  inferSeatSectorFromCommittees,
  resolveIssuerTradeSector,
  resolvePoliticianCommittees,
} from '@/lib/seatSector';

/** Public codes returned to mobile clients (i18n keys: tradeFlags.*). */
export const TRADE_FLAG_CODES = [
  'notable_size',
  'committee_sector',
  'congress_cluster',
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
  issuerSector?: string | null;
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

export function isCommitteeSectorTrade(input: {
  politicianId: string;
  committees?: string | null;
  ticker?: string | null;
  issuerSector?: string | null;
}): boolean {
  const committees = resolvePoliticianCommittees(
    input.politicianId,
    input.committees,
  );
  const committeeSector = inferSeatSectorFromCommittees(committees);
  if (!committeeSector) return false;
  const tradeSector = resolveIssuerTradeSector(input.ticker, input.issuerSector);
  return Boolean(tradeSector && tradeSector === committeeSector);
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
      ticker: input.ticker,
      issuerSector: input.issuerSector,
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

export async function fetchCongressClusterKeys(
  prisma: {
    trade: {
      findMany: (args: unknown) => Promise<
        {
          politician_id: string;
          type: string;
          Issuer: { ticker: string | null } | null;
        }[]
      >;
    };
  },
  tradeWhere: Record<string, unknown>,
): Promise<Set<string>> {
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

  return buildCongressClusterKeys(
    rows.map((r) => {
      const t = r.type.toLowerCase();
      const proposed = t.includes('proposed');
      const sell = t.includes('sell');
      const side: TradeSideFlag = proposed
        ? 'proposed_sale'
        : sell
          ? 'sell'
          : 'buy';
      return {
        politicianId: r.politician_id,
        ticker: r.Issuer?.ticker,
        side,
      };
    }),
  );
}
