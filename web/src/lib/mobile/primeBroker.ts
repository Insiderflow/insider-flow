import { normalizeGicsSectorKey } from '@/lib/industrySubsectorTaxonomy';
import { isOpenInsiderSell } from '@/lib/openInsiderTransaction';

type Flow = { buy: number; sell: number; trades: number };

export type PrimeBrokerSummary = {
  id: string;
  name: string;
  flowAmount: number;
  direction: 'inflow' | 'outflow';
  industryCount: number;
};

export type PrimeBrokerIndustryRow = {
  nameKey: string;
  name: string;
  amount: number;
  tradeCount: number;
  pct: number;
};

export type PrimeBrokerDetail = {
  id: string;
  name: string;
  flowAmount: number;
  industryCount: number;
  industries: PrimeBrokerIndustryRow[];
};

const INSTITUTIONAL_NAME_HINTS = [
  'llc',
  'l.p.',
  ' l.p',
  'inc',
  'corp',
  'co.',
  'management',
  'capital',
  'partners',
  'holdings',
  'advisors',
  'advisers',
  'group',
  'bank',
  'financial',
  'morgan stanley',
  'goldman',
  'merrill',
  'ubs',
  'barclays',
  'j.p. morgan',
  'jp morgan',
  'citigroup',
  'credit suisse',
  'deutsche',
  'nomura',
  'bofa',
  'blackrock',
  'vanguard',
  'schwab',
  'fidelity',
  'magnetar',
  'millennium',
  'warburg',
  'saba capital',
  'asset management',
  'investment',
  'sponsor',
  'affiliate',
];

const OFFICER_TITLE =
  /\b(dir|director|ceo|cfo|coo|cto|pres|president|chair|officer|founder|evp|svp|vp|chief)\b/i;

/** Form 4 filer is an institutional 10% / broker-dealer block, not an individual insider. */
export function isPrimeBrokerFiler(
  ownerName: string,
  ownerTitle: string | null | undefined,
): boolean {
  const name = String(ownerName || '').trim();
  const title = String(ownerTitle || '').toLowerCase();
  if (!name) return false;

  if (title.includes('broker-dealer') || title.includes('market maker')) {
    return true;
  }

  if (!title.includes('10%')) return false;

  const titleWithoutPct = title.replace(/10\s*%/g, ' ').trim();
  if (OFFICER_TITLE.test(titleWithoutPct)) return false;

  return isInstitutionalOwnerName(name);
}

export function isInstitutionalOwnerName(name: string): boolean {
  const n = name.toLowerCase();
  return INSTITUTIONAL_NAME_HINTS.some((hint) => n.includes(hint));
}

export function normalizeBrokerDisplayName(ownerName: string): string {
  let n = ownerName.trim();
  n = n.replace(/\s+Group Inc\.?$/i, '');
  n = n.replace(/\s+Group,?\s*Inc\.?$/i, ' Group');
  n = n.replace(/\s+Inc\.?$/i, '');
  n = n.replace(/\s*,?\s*L\.?P\.?$/i, '');
  n = n.replace(/\s*,?\s*LLC$/i, '');
  return n.trim() || ownerName.trim();
}

export function brokerSlugFromName(ownerName: string): string {
  return normalizeBrokerDisplayName(ownerName)
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

type TxRow = {
  transactionType: string;
  valueNumeric: unknown;
  owner: { name: string; title: string | null };
  company: { ticker: string | null };
};

type IssuerSector = { ticker: string | null; sector: string | null };

function amt(valueNumeric: unknown): number {
  return Number(valueNumeric || 0);
}

function accumulateBrokerFlows(
  rows: TxRow[],
  issuerByTicker: Map<string, IssuerSector>,
) {
  const brokers = new Map<
    string,
    {
      displayName: string;
      totalBuy: number;
      totalSell: number;
      industries: Map<string, Flow>;
    }
  >();

  for (const row of rows) {
    if (!isPrimeBrokerFiler(row.owner.name, row.owner.title)) continue;

    const displayName = normalizeBrokerDisplayName(row.owner.name);
    const id = brokerSlugFromName(row.owner.name);
    const ticker = row.company?.ticker?.trim().toUpperCase();
    const sector = normalizeGicsSectorKey(
      (ticker && issuerByTicker.get(ticker)?.sector) || 'Other',
    );
    const value = amt(row.valueNumeric);
    const sell = isOpenInsiderSell(row.transactionType);

    const broker =
      brokers.get(id) ||
      {
        displayName,
        totalBuy: 0,
        totalSell: 0,
        industries: new Map<string, Flow>(),
      };

    if (sell) broker.totalSell += value;
    else broker.totalBuy += value;

    const ind = broker.industries.get(sector) || { buy: 0, sell: 0, trades: 0 };
    if (sell) ind.sell += value;
    else ind.buy += value;
    ind.trades += 1;
    broker.industries.set(sector, ind);

    brokers.set(id, broker);
  }

  return brokers;
}

export function buildPrimeBrokerSummaries(
  rows: TxRow[],
  issuerByTicker: Map<string, IssuerSector>,
  limit = 6,
): PrimeBrokerSummary[] {
  const brokers = accumulateBrokerFlows(rows, issuerByTicker);

  return [...brokers.entries()]
    .map(([id, b]) => {
      const flowAmount = b.totalBuy + b.totalSell;
      return {
        id,
        name: b.displayName,
        flowAmount,
        direction: (b.totalBuy >= b.totalSell ? 'inflow' : 'outflow') as
          | 'inflow'
          | 'outflow',
        industryCount: b.industries.size,
      };
    })
    .sort((a, b) => b.flowAmount - a.flowAmount)
    .slice(0, limit);
}

export function buildPrimeBrokerDetail(
  rows: TxRow[],
  issuerByTicker: Map<string, IssuerSector>,
  brokerId: string,
  industryLimit = 10,
): PrimeBrokerDetail | null {
  const brokers = accumulateBrokerFlows(rows, issuerByTicker);
  const broker = brokers.get(brokerId);
  if (!broker) return null;

  const flowAmount = broker.totalBuy + broker.totalSell;
  const industries = [...broker.industries.entries()]
    .map(([nameKey, flow]) => ({
      nameKey,
      name: nameKey,
      amount: flow.buy + flow.sell,
      tradeCount: flow.trades,
      pct: flowAmount > 0 ? Math.round(((flow.buy + flow.sell) / flowAmount) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, industryLimit);

  return {
    id: brokerId,
    name: broker.displayName,
    flowAmount,
    industryCount: broker.industries.size,
    industries,
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
