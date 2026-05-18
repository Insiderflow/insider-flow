import { normalizeGicsSectorKey } from '@/lib/industrySubsectorTaxonomy';
import { resolveIssuerTradeSector } from '@/lib/seatSector';
import { isCommitteeSectorTrade } from '@/lib/mobile/tradeFlags';

export type CommitteeSectorRow = {
  sectorKey: string;
  buyAmount: number;
  sellAmount: number;
  tradeCount: number;
};

export type CommitteeSectorSummary = {
  /** Volume where trade sector matches member committee sector. */
  alignedVolume: number;
  totalVolume: number;
  /** 0–100 */
  alignedPct: number;
  rows: CommitteeSectorRow[];
};

type TradeInput = {
  politicianId: string;
  committees?: string | null;
  ticker?: string | null;
  issuerSector?: string | null;
  type: string;
  amountUsd: number;
};

function isSellType(type: string): boolean {
  return type.toLowerCase().includes('sell');
}

export function buildCommitteeSectorSummary(trades: TradeInput[]): CommitteeSectorSummary {
  const sectorMap = new Map<string, { buy: number; sell: number; count: number }>();
  let alignedVolume = 0;
  let totalVolume = 0;

  for (const t of trades) {
    const amount = t.amountUsd;
    if (amount <= 0) continue;
    totalVolume += amount;

    if (
      !isCommitteeSectorTrade({
        politicianId: t.politicianId,
        committees: t.committees,
        ticker: t.ticker,
        issuerSector: t.issuerSector,
      })
    ) {
      continue;
    }

    alignedVolume += amount;
    const sectorKey = normalizeGicsSectorKey(
      resolveIssuerTradeSector(t.ticker, t.issuerSector) || 'Other',
    );
    const cur = sectorMap.get(sectorKey) || { buy: 0, sell: 0, count: 0 };
    if (isSellType(t.type)) cur.sell += amount;
    else cur.buy += amount;
    cur.count += 1;
    sectorMap.set(sectorKey, cur);
  }

  const rows: CommitteeSectorRow[] = [...sectorMap.entries()]
    .map(([sectorKey, v]) => ({
      sectorKey,
      buyAmount: v.buy,
      sellAmount: v.sell,
      tradeCount: v.count,
    }))
    .sort((a, b) => b.buyAmount + b.sellAmount - (a.buyAmount + a.sellAmount))
    .slice(0, 6);

  const alignedPct =
    totalVolume > 0 ? Math.round((alignedVolume / totalVolume) * 100) : 0;

  return { alignedVolume, totalVolume, alignedPct, rows };
}
