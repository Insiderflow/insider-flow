import { prisma } from '@/lib/prisma';
import { getPoliticianImageSrc } from '@/lib/politicianImageMapping';
import {
  computePoliticianTradeFlags,
  fetchCongressClusterKeys,
  type TradeFlagCode,
} from '@/lib/mobile/tradeFlags';
import { politicianTradeWhere } from '@/lib/mobile/tradeDateSanity';
import type { MobilePeriod } from '@/lib/mobile/dashboardBuilder';

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
  if (flags.includes('committee_sector')) score += 20;
  if (flags.includes('notable_size')) score += 15;
  return score;
}

export type MobileSignalItem = {
  id: string;
  tradeId: string;
  ticker: string;
  issuerName: string;
  politicianId: string;
  politicianName: string;
  party: 'R' | 'D' | 'I';
  side: 'buy' | 'sell' | 'proposed_sale';
  flags: TradeFlagCode[];
  amountUsd: number;
  filedAt: string;
  score: number;
  imageUrl?: string;
};

export type MobileSignalsPayload = {
  period: MobilePeriod;
  generatedAt: string;
  signals: MobileSignalItem[];
};

export async function buildMobileSignals(
  period: MobilePeriod = '7D',
  limit = 40,
): Promise<MobileSignalsPayload> {
  const since = periodStart(period);
  const baseWhere = politicianTradeWhere();
  const where = { ...baseWhere, traded_at: { gte: since } };

  const [rows, clusterKeys] = await Promise.all([
    prisma.trade.findMany({
      where,
      include: { Politician: true, Issuer: true },
      orderBy: { published_at: 'desc' },
      take: 500,
    }),
    fetchCongressClusterKeys(prisma, baseWhere),
  ]);

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
        issuerSector: r.Issuer?.sector,
      },
      clusterKeys,
    );
    if (!flags.length) continue;

    const ticker = r.Issuer?.ticker?.trim().toUpperCase() || '—';
    signals.push({
      id: `signal-${r.id}`,
      tradeId: r.id,
      ticker,
      issuerName: r.Issuer?.name || ticker,
      politicianId: r.politician_id,
      politicianName: r.Politician?.name || '',
      party: partyCode(r.Politician?.party),
      side,
      flags,
      amountUsd,
      filedAt:
        r.published_at?.toISOString().slice(0, 10) ||
        r.traded_at.toISOString().slice(0, 10),
      score: signalScore(flags),
      imageUrl: getPoliticianImageSrc(r.politician_id, r.Politician?.name || ''),
    });
  }

  signals.sort((a, b) => b.score - a.score || b.filedAt.localeCompare(a.filedAt));

  return {
    period,
    generatedAt: new Date().toISOString(),
    signals: signals.slice(0, limit),
  };
}
