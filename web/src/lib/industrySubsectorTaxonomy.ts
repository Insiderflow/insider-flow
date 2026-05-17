/**
 * Canonical sub-sector taxonomy for industry-chain UI.
 * Parent values match `Issuer.sector` (GICS-style strings in Neon).
 */

export type IndustrySubsectorDef = {
  slug: string;
  parent_sector: string;
  name_en: string;
  sort_order: number;
};

const PARENT_PREFIX: Record<string, string> = {
  Energy: 'energy',
  Utilities: 'util',
  InformationTechnology: 'it',
  Healthcare: 'hc',
  Financials: 'fin',
  Industrials: 'ind',
  Materials: 'mat',
  RealEstate: 're',
  ConsumerDiscretionary: 'cd',
  ConsumerStaples: 'cs',
  CommunicationServices: 'comm',
  Other: 'oth',
  'N/A': 'na',
  Biotechnology: 'bio',
  'Banks - Regional': 'bank-reg',
  Aerospace: 'aero',
  'Food & Agriculture': 'food',
  Semiconductor: 'semi',
  Software: 'sw',
  'Oil & Gas': 'ong',
};

function slugify(label: string): string {
  return label
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function defs(
  parent_sector: string,
  labels: string[],
): IndustrySubsectorDef[] {
  const prefix = PARENT_PREFIX[parent_sector] || slugify(parent_sector);
  return labels.map((name_en, i) => ({
    slug: `${prefix}-${slugify(name_en)}`,
    parent_sector,
    name_en,
    sort_order: i + 1,
  }));
}

export const INDUSTRY_SUBSECTOR_TAXONOMY: IndustrySubsectorDef[] = [
  ...defs('Energy', ['Oil & Gas', 'Renewables', 'Coal']),
  ...defs('Utilities', ['Electric Utilities', 'Gas Utilities', 'Water Utilities']),
  ...defs('InformationTechnology', [
    'Semiconductor Equipment & Materials',
    'Semiconductors',
    'Semiconductor Memory',
    'Electronic Components',
    'Computer Hardware',
    'Consumer Electronics',
    'Data Storage',
    'Software - Infrastructure',
    'Software - Application',
    'Hardware',
    'IT Services',
  ]),
  ...defs('Healthcare', ['Pharma', 'Hospitals', 'Devices', 'Biotech', 'Diagnostics']),
  ...defs('Financials', ['Banks', 'Asset Mgmt', 'Insurance', 'Fintech', 'Payments']),
  ...defs('Industrials', ['Aerospace & Defense', 'Machinery', 'Transportation', 'Construction']),
  ...defs('Materials', ['Chemicals', 'Metals & Mining', 'Paper & Packaging']),
  ...defs('RealEstate', ['REITs', 'Real Estate Services', 'Development']),
  ...defs('ConsumerDiscretionary', ['Retail', 'Automotive', 'Leisure', 'E-Commerce']),
  ...defs('ConsumerStaples', ['Food & Beverage', 'Household Products', 'Tobacco']),
  ...defs('CommunicationServices', ['Media', 'Telecom', 'Interactive Media']),
  ...defs('Other', ['Industrials', 'Materials', 'Real Estate', 'Consumer']),
  ...defs('N/A', ['Mixed', 'Private', 'Funds', 'Other']),
  ...defs('Biotechnology', ['Gene Therapy', 'Devices', 'Pharma', 'Diagnostics']),
  ...defs('Banks - Regional', ['Lending', 'Wealth', 'Payments', 'Insurance']),
  ...defs('Aerospace', ['Defense', 'Commercial', 'Space', 'Components']),
  ...defs('Food & Agriculture', ['Protein', 'Crop Science', 'Packaged Food', 'Ag Equipment']),
  ...defs('Semiconductor', [
    'Semiconductor Equipment & Materials',
    'Semiconductors',
    'Semiconductor Memory',
    'Electronic Components',
    'Computer Hardware',
    'Consumer Electronics',
    'Data Storage',
  ]),
  ...defs('Software', ['Software - Infrastructure', 'Software - Application']),
  ...defs('Oil & Gas', [
    'Oil & Gas Drilling',
    'Oil & Gas E&P',
    'Oil & Gas Equipment & Services',
    'Oil & Gas Midstream',
    'Oil & Gas Integrated',
    'Oil & Gas Refining & Marketing',
  ]),
];

export const SUBSECTOR_BY_SLUG = new Map(
  INDUSTRY_SUBSECTOR_TAXONOMY.map((d) => [d.slug, d]),
);

export const SUBSECTORS_BY_PARENT = INDUSTRY_SUBSECTOR_TAXONOMY.reduce(
  (acc, d) => {
    const list = acc.get(d.parent_sector) || [];
    list.push(d);
    acc.set(d.parent_sector, list);
    return acc;
  },
  new Map<string, IndustrySubsectorDef[]>(),
);

/** Ticker → sub-sector slug (high-confidence mapping for backfill). */
export const TICKER_TO_SUBSECTOR_SLUG: Record<string, string> = {
  NVDA: 'it-semiconductors',
  AMD: 'it-semiconductors',
  INTC: 'it-semiconductors',
  AVGO: 'it-semiconductors',
  QCOM: 'it-semiconductors',
  MU: 'it-semiconductor-memory',
  AMAT: 'it-semiconductor-equipment-and-materials',
  LRCX: 'it-semiconductor-equipment-and-materials',
  MSFT: 'it-software-infrastructure',
  ORCL: 'it-software-infrastructure',
  CRM: 'it-software-application',
  ADBE: 'it-software-application',
  XOM: 'energy-oil-and-gas',
  CVX: 'energy-oil-and-gas',
  COP: 'ong-oil-and-gas-eandp',
  SLB: 'ong-oil-and-gas-equipment-and-services',
  JPM: 'fin-banks',
  BAC: 'fin-banks',
  GS: 'fin-banks',
  MS: 'fin-banks',
  PFE: 'hc-pharma',
  JNJ: 'hc-pharma',
  UNH: 'hc-hospitals',
  AAPL: 'it-consumer-electronics',
  GOOGL: 'comm-interactive-media',
  GOOG: 'comm-interactive-media',
  META: 'comm-interactive-media',
  AMZN: 'cd-e-commerce',
  TSLA: 'cd-automotive',
  NEE: 'util-electric-utilities',
  DUK: 'util-electric-utilities',
};

export function inferSubsectorSlug(input: {
  ticker?: string | null;
  sector?: string | null;
}): string | null {
  const sym = String(input.ticker || '')
    .trim()
    .toUpperCase();
  if (sym && TICKER_TO_SUBSECTOR_SLUG[sym]) {
    const slug = TICKER_TO_SUBSECTOR_SLUG[sym];
    if (SUBSECTOR_BY_SLUG.has(slug)) {
      const def = SUBSECTOR_BY_SLUG.get(slug)!;
      if (!input.sector || def.parent_sector === input.sector) return slug;
    }
  }
  return null;
}

export function defaultSubsectorSlugForSector(sector: string | null | undefined): string | null {
  const list = SUBSECTORS_BY_PARENT.get(String(sector || '').trim());
  return list?.[0]?.slug ?? null;
}

/** Map DB / Finnhub / ticker-heuristic labels to Issuer.sector-style keys. */
const SECTOR_KEY_ALIASES: Record<string, string> = {
  'Information Technology': 'InformationTechnology',
  'Health Care': 'Healthcare',
  'Consumer Discretionary': 'ConsumerDiscretionary',
  'Consumer Staples': 'ConsumerStaples',
  'Communication Services': 'CommunicationServices',
  'Real Estate': 'RealEstate',
  FinancialServices: 'Financials',
};

export function normalizeGicsSectorKey(raw: string | null | undefined): string {
  const trimmed = String(raw || '').trim();
  if (!trimmed) return 'Other';
  if (SUBSECTORS_BY_PARENT.has(trimmed)) return trimmed;
  if (SECTOR_KEY_ALIASES[trimmed]) return SECTOR_KEY_ALIASES[trimmed];
  const compact = trimmed
    .replace(/&/g, 'And')
    .replace(/[/_\s-]+/g, '');
  if (SUBSECTORS_BY_PARENT.has(compact)) return compact;
  return SECTOR_KEY_ALIASES[trimmed] ?? compact;
}
