import { normalizeGicsSectorKey } from '@/lib/industrySubsectorTaxonomy';
import {
  isOpenInsiderBuy,
  isOpenInsiderSell,
  openInsiderMarketSide,
  openInsiderTradeValue,
} from '@/lib/openInsiderTransaction';
import { isPrimeBrokerFiler } from '@/lib/mobile/primeBroker';

export type IndustrySide = 'buy' | 'sell';

export type IndustrySectorSummary = {
  nameKey: string;
  name: string;
  buyAmount: number;
  sellAmount: number;
};

export type IndustryCompanyRow = {
  ticker: string;
  companyName: string;
  amount: number;
  tradeCount: number;
  insiderCount: number;
};

export type IndustryDetailPayload = {
  sector: string;
  side: IndustrySide;
  sectors: IndustrySectorSummary[];
  companies: IndustryCompanyRow[];
};

type TxRow = {
  transactionType: string;
  valueNumeric: unknown;
  ownerId: string | null;
  owner: { name: string; title: string | null };
  company: { ticker: string | null; name: string | null };
};

type IssuerSector = { ticker: string | null; sector: string | null };

function amt(valueNumeric: unknown): number {
  return Number(valueNumeric || 0);
}

function sectorForRow(
  row: TxRow,
  issuerByTicker: Map<string, IssuerSector>,
): string {
  const ticker = row.company?.ticker?.trim().toUpperCase();
  return normalizeGicsSectorKey(
    (ticker && issuerByTicker.get(ticker)?.sector) || 'Other',
  );
}

function matchesSide(row: TxRow, side: IndustrySide): boolean {
  return side === 'sell'
    ? isOpenInsiderSell(row.transactionType)
    : isOpenInsiderBuy(row.transactionType);
}

/** Insider trades by GICS sector and ticker (excludes institutional 10% blocks). */
export function buildIndustryDetail(
  rows: TxRow[],
  issuerByTicker: Map<string, IssuerSector>,
  sectorKey: string,
  side: IndustrySide,
  companyLimit = 50,
): IndustryDetailPayload {
  const sectorAgg = new Map<string, { buy: number; sell: number }>();
  const bySectorTicker = new Map<
    string,
    Map<
      string,
      {
        companyName: string;
        amount: number;
        trades: number;
        insiders: Set<string>;
      }
    >
  >();

  const activeSector = normalizeGicsSectorKey(sectorKey || 'Other');

  for (const row of rows) {
    if (isPrimeBrokerFiler(row.owner.name, row.owner.title)) continue;

    const ticker = row.company?.ticker?.trim().toUpperCase();
    if (!ticker || ticker === '—') continue;

    const sector = sectorForRow(row, issuerByTicker);
    const value = amt(row.valueNumeric);
    const marketSide = openInsiderMarketSide(row.transactionType);

    const agg = sectorAgg.get(sector) || { buy: 0, sell: 0 };
    if (marketSide === 'sell') agg.sell += value;
    else if (marketSide === 'buy') agg.buy += value;
    sectorAgg.set(sector, agg);

    if (sector !== activeSector || !matchesSide(row, side)) continue;

    const sectorMap =
      bySectorTicker.get(sector) ||
      new Map<
        string,
        {
          companyName: string;
          amount: number;
          trades: number;
          insiders: Set<string>;
        }
      >();

    const cur = sectorMap.get(ticker) || {
      companyName: (row.company?.name || ticker).trim(),
      amount: 0,
      trades: 0,
      insiders: new Set<string>(),
    };
    cur.amount += Math.abs(value);
    cur.trades += 1;
    if (row.ownerId) cur.insiders.add(row.ownerId);
    else if (row.owner?.name) cur.insiders.add(row.owner.name);
    sectorMap.set(ticker, cur);
    bySectorTicker.set(sector, sectorMap);
  }

  const sectors = [...sectorAgg.entries()]
    .map(([nameKey, v]) => ({
      nameKey,
      name: nameKey,
      buyAmount: v.buy,
      sellAmount: v.sell,
    }))
    .sort((a, b) => {
      const aScore = side === 'buy' ? a.buyAmount : a.sellAmount;
      const bScore = side === 'buy' ? b.buyAmount : b.sellAmount;
      return bScore - aScore;
    });

  const companies = [...(bySectorTicker.get(activeSector)?.entries() ?? [])]
    .map(([ticker, v]) => ({
      ticker,
      companyName: v.companyName,
      amount: v.amount,
      tradeCount: v.trades,
      insiderCount: v.insiders.size,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, companyLimit);

  return {
    sector: activeSector,
    side,
    sectors,
    companies,
  };
}

export async function loadIssuerSectorByTicker(
  tickers: string[],
  prisma: {
    issuer: {
      findMany: (args: {
        where: { ticker: { in: string[] } };
        select: { ticker: true; sector: true };
      }) => Promise<IssuerSector[]>;
    };
  },
): Promise<Map<string, IssuerSector>> {
  if (!tickers.length) return new Map();
  const issuers = await prisma.issuer.findMany({
    where: { ticker: { in: tickers } },
    select: { ticker: true, sector: true },
  });
  return new Map(
    issuers
      .filter((i) => i.ticker)
      .map((i) => [i.ticker!.toUpperCase(), i]),
  );
}
