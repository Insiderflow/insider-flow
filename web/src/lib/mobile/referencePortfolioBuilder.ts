import type { ReferencePortfolioTemplate } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  computePoliticianTradeFlags,
  fetchCongressClusterKeys,
} from '@/lib/mobile/tradeFlags';
import { politicianTradeWhere } from '@/lib/mobile/tradeDateSanity';

export const MAX_PORTFOLIOS_PER_USER = 3;
export const MAX_POSITION_LIMIT = 20;

function tradeAmount(sizeMin: unknown, sizeMax: unknown): number {
  const max = Number(sizeMax || 0);
  const min = Number(sizeMin || 0);
  return max > 0 ? max : min;
}

export type PortfolioPositionDraft = {
  ticker: string;
  issuerName: string;
  side: string;
  sourceTradeId: string;
  disclosureDate: Date;
};

export async function buildPoliticianMirrorPositions(
  politicianId: string,
  periodDays: number,
  positionLimit: number,
): Promise<PortfolioPositionDraft[]> {
  const since = new Date();
  since.setDate(since.getDate() - periodDays);

  const rows = await prisma.trade.findMany({
    where: {
      ...politicianTradeWhere(),
      politician_id: politicianId,
      traded_at: { gte: since },
      NOT: { type: { contains: 'sell', mode: 'insensitive' } },
    },
    include: { Issuer: true },
    orderBy: { traded_at: 'desc' },
    take: 200,
  });

  const byTicker = new Map<string, PortfolioPositionDraft>();
  for (const r of rows) {
    const ticker = r.Issuer?.ticker?.trim().toUpperCase();
    if (!ticker || byTicker.has(ticker)) continue;
    byTicker.set(ticker, {
      ticker,
      issuerName: r.Issuer?.name || ticker,
      side: 'buy',
      sourceTradeId: r.id,
      disclosureDate: r.published_at || r.traded_at,
    });
    if (byTicker.size >= positionLimit) break;
  }

  return [...byTicker.values()];
}

export async function buildFlaggedBuyPositions(
  periodDays: number,
  positionLimit: number,
): Promise<PortfolioPositionDraft[]> {
  const since = new Date();
  since.setDate(since.getDate() - periodDays);
  const baseWhere = politicianTradeWhere();

  const [rows, clusterKeys] = await Promise.all([
    prisma.trade.findMany({
      where: { ...baseWhere, traded_at: { gte: since } },
      include: { Politician: true, Issuer: true },
      orderBy: { published_at: 'desc' },
      take: 400,
    }),
    fetchCongressClusterKeys(prisma, baseWhere),
  ]);

  const scored: Array<PortfolioPositionDraft & { score: number }> = [];

  for (const r of rows) {
    if (r.type.toLowerCase().includes('sell')) continue;
    const amountUsd = tradeAmount(r.size_min, r.size_max);
    const flags = computePoliticianTradeFlags(
      {
        id: r.id,
        politicianId: r.politician_id,
        ticker: r.Issuer?.ticker,
        side: 'buy',
        amountUsd,
        committees: r.Politician?.committees,
        committeeAssignments: r.Politician?.committee_assignments,
        issuerSector: r.Issuer?.sector,
        subSectorSlug: r.Issuer?.sub_sector_slug,
      },
      clusterKeys,
    );
    if (!flags.length) continue;
    const ticker = r.Issuer?.ticker?.trim().toUpperCase();
    if (!ticker) continue;
    if (scored.some((s) => s.ticker === ticker)) continue;

    let score = flags.length * 10;
    if (flags.includes('congress_cluster')) score += 30;
    if (flags.includes('committee_sector')) score += 20;
    if (flags.includes('notable_size')) score += 15;

    scored.push({
      ticker,
      issuerName: r.Issuer?.name || ticker,
      side: 'buy',
      sourceTradeId: r.id,
      disclosureDate: r.published_at || r.traded_at,
      score,
    });
    if (scored.length >= positionLimit * 2) break;
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, positionLimit).map(({ score: _s, ...rest }) => rest);
}

export async function rebuildPortfolioPositions(
  template: ReferencePortfolioTemplate,
  opts: {
    politicianId?: string | null;
    periodDays: number;
    positionLimit: number;
  },
): Promise<PortfolioPositionDraft[]> {
  if (template === 'politician_mirror') {
    if (!opts.politicianId) {
      throw new Error('politician_id_required');
    }
    return buildPoliticianMirrorPositions(
      opts.politicianId,
      opts.periodDays,
      opts.positionLimit,
    );
  }
  return buildFlaggedBuyPositions(opts.periodDays, opts.positionLimit);
}

export function equalWeights(count: number): number[] {
  if (count <= 0) return [];
  const pct = Math.round((100 / count) * 100) / 100;
  const weights = Array(count).fill(pct);
  const drift = 100 - weights.reduce((a, b) => a + b, 0);
  if (weights.length) weights[0] += drift;
  return weights;
}

export type SerializedPortfolio = {
  id: string;
  name: string;
  template: ReferencePortfolioTemplate;
  politicianId: string | null;
  politicianName: string | null;
  periodDays: number;
  positionLimit: number;
  lastBuiltAt: string | null;
  createdAt: string;
  positions: Array<{
    id: string;
    ticker: string;
    issuerName: string | null;
    side: string;
    weightPct: number;
    disclosureDate: string | null;
    sourceTradeId: string | null;
  }>;
  disclaimer: string;
};

export function serializePortfolio(
  row: {
    id: string;
    name: string;
    template: ReferencePortfolioTemplate;
    politician_id: string | null;
    period_days: number;
    position_limit: number;
    last_built_at: Date | null;
    created_at: Date;
    Politician?: { name: string } | null;
    positions: Array<{
      id: string;
      ticker: string;
      issuer_name: string | null;
      side: string;
      weight_pct: number;
      disclosure_date: Date | null;
      source_trade_id: string | null;
    }>;
  },
): SerializedPortfolio {
  return {
    id: row.id,
    name: row.name,
    template: row.template,
    politicianId: row.politician_id,
    politicianName: row.Politician?.name || null,
    periodDays: row.period_days,
    positionLimit: row.position_limit,
    lastBuiltAt: row.last_built_at?.toISOString() || null,
    createdAt: row.created_at.toISOString(),
    positions: row.positions.map((p) => ({
      id: p.id,
      ticker: p.ticker,
      issuerName: p.issuer_name,
      side: p.side,
      weightPct: p.weight_pct,
      disclosureDate: p.disclosure_date?.toISOString().slice(0, 10) || null,
      sourceTradeId: p.source_trade_id,
    })),
    disclaimer: 'paper_only',
  };
}
