import { prisma } from '@/lib/prisma';
import { getPoliticianImageSrc } from '@/lib/politicianImageMapping';
import {
  computePoliticianTradeFlags,
  fetchCongressClusterKeys,
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

export type DiscoverPolitician = {
  id: string;
  name: string;
  party: 'R' | 'D' | 'I';
  state: string;
  tradeCount: number;
  volume: number;
  imageUrl?: string;
};

export type DiscoverTicker = {
  ticker: string;
  name: string;
  tradeCount: number;
  volume: number;
};

export type DiscoverFlaggedTrade = {
  id: string;
  politicianId: string;
  politicianName: string;
  party: 'R' | 'D' | 'I';
  ticker: string;
  side: 'buy' | 'sell' | 'proposed_sale';
  amount: number;
  filedAt: string;
  flags: string[];
};

export type MobileDiscoverPayload = {
  activePoliticians: DiscoverPolitician[];
  activeTickers: DiscoverTicker[];
  recentFlagged: DiscoverFlaggedTrade[];
};

export async function buildMobileDiscover(
  period: MobilePeriod = '7D',
): Promise<MobileDiscoverPayload> {
  const since = periodStart(period);
  const where = { ...politicianTradeWhere(), traded_at: { gte: since } };

  const [rows, clusterKeys] = await Promise.all([
    prisma.trade.findMany({
      where,
      include: { Politician: true, Issuer: true },
      orderBy: { traded_at: 'desc' },
      take: 400,
    }),
    fetchCongressClusterKeys(prisma, politicianTradeWhere()),
  ]);

  const politicianAgg = new Map<string, DiscoverPolitician>();
  const tickerAgg = new Map<string, DiscoverTicker>();

  for (const r of rows) {
    const amount = tradeAmount(r.size_min, r.size_max);
    const pid = r.politician_id;
    const pcur = politicianAgg.get(pid) || {
      id: pid,
      name: r.Politician?.name || '',
      party: partyCode(r.Politician?.party),
      state: r.Politician?.state || '',
      tradeCount: 0,
      volume: 0,
      imageUrl: getPoliticianImageSrc(pid, r.Politician?.name || ''),
    };
    pcur.tradeCount += 1;
    pcur.volume += amount;
    politicianAgg.set(pid, pcur);

    const ticker = r.Issuer?.ticker?.trim().toUpperCase();
    if (ticker) {
      const tcur = tickerAgg.get(ticker) || {
        ticker,
        name: r.Issuer?.name || ticker,
        tradeCount: 0,
        volume: 0,
      };
      tcur.tradeCount += 1;
      tcur.volume += amount;
      tickerAgg.set(ticker, tcur);
    }
  }

  const activePoliticians = [...politicianAgg.values()]
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 10);

  const activeTickers = [...tickerAgg.values()]
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 10);

  const recentFlagged: DiscoverFlaggedTrade[] = [];
  for (const r of rows) {
    if (recentFlagged.length >= 8) break;
    const sell = r.type.toLowerCase().includes('sell');
    const proposed = r.type.toLowerCase().includes('proposed');
    const side = proposed ? 'proposed_sale' : sell ? 'sell' : 'buy';
    const amount = tradeAmount(r.size_min, r.size_max);
    const flags = computePoliticianTradeFlags(
      {
        id: r.id,
        politicianId: r.politician_id,
        ticker: r.Issuer?.ticker,
        side,
        amountUsd: amount,
        committees: r.Politician?.committees,
        issuerSector: r.Issuer?.sector,
      },
      clusterKeys,
    );
    if (!flags.length) continue;
    recentFlagged.push({
      id: r.id,
      politicianId: r.politician_id,
      politicianName: r.Politician?.name || '',
      party: partyCode(r.Politician?.party),
      ticker: r.Issuer?.ticker || '—',
      side,
      amount,
      filedAt:
        r.published_at?.toISOString().slice(0, 10) ||
        r.traded_at.toISOString().slice(0, 10),
      flags,
    });
  }

  return { activePoliticians, activeTickers, recentFlagged };
}
