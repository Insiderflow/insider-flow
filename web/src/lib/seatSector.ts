import type { SectorName } from '@/lib/politiciansBySector';
import { normalizeToTargetSector } from '@/lib/politiciansBySector';
import politicianCommitteesSeed from '@/data/politician_committees.seed.json';

/**
 * Keyword → GICS sector mapping for US congressional committees (aligned with mobile PoliticianTrades.jsx).
 */
export function inferSeatSectorFromCommittees(committees: string | null | undefined): SectorName | null {
  const raw = String(committees || '').toLowerCase();
  if (!raw) return null;

  const rules: { sector: SectorName; keywords: string[] }[] = [
    { sector: 'Information Technology', keywords: ['science', 'technology', 'cyber', 'innovation'] },
    { sector: 'Financials', keywords: ['finance', 'financial services', 'banking', 'ways and means'] },
    { sector: 'Industrials', keywords: ['transportation', 'infrastructure', 'commerce', 'public works'] },
    { sector: 'Health Care', keywords: ['health', 'healthcare', 'public health'] },
    { sector: 'Consumer Discretionary', keywords: ['small business', 'tourism'] },
    { sector: 'Communication Services', keywords: ['intelligence', 'communications', 'telecommunications'] },
    { sector: 'Consumer Staples', keywords: ['agriculture', 'food'] },
    { sector: 'Energy', keywords: ['energy', 'natural resources'] },
    { sector: 'Materials', keywords: ['natural resources', 'environment', 'mining'] },
    { sector: 'Real Estate', keywords: ['housing', 'urban affairs', 'real estate'] },
    { sector: 'Utilities', keywords: ['energy and commerce', 'public works', 'infrastructure'] },
  ];

  for (const rule of rules) {
    if (rule.keywords.some((kw) => raw.includes(kw))) return rule.sector;
  }
  return null;
}

/** GICS sector for well-known tickers when Issuer.sector is missing in DB. */
const TICKER_TO_SECTOR: Partial<Record<string, SectorName>> = {
  AAPL: 'Information Technology',
  MSFT: 'Information Technology',
  NVDA: 'Information Technology',
  AMD: 'Information Technology',
  INTC: 'Information Technology',
  CRM: 'Information Technology',
  ORCL: 'Information Technology',
  GOOG: 'Communication Services',
  GOOGL: 'Communication Services',
  META: 'Communication Services',
  NFLX: 'Communication Services',
  DIS: 'Communication Services',
  CMCSA: 'Communication Services',
  T: 'Communication Services',
  VZ: 'Communication Services',
  JPM: 'Financials',
  BAC: 'Financials',
  GS: 'Financials',
  MS: 'Financials',
  XOM: 'Energy',
  CVX: 'Energy',
  PFE: 'Health Care',
  JNJ: 'Health Care',
  UNH: 'Health Care',
  WMT: 'Consumer Staples',
  PG: 'Consumer Staples',
  KO: 'Consumer Staples',
  AMZN: 'Consumer Discretionary',
  TSLA: 'Consumer Discretionary',
  HD: 'Consumer Discretionary',
  NKE: 'Consumer Discretionary',
  BA: 'Industrials',
  CAT: 'Industrials',
  LMT: 'Industrials',
  GLD: 'Materials',
};

type CommitteesSeed = Record<string, string>;

const seedByPoliticianId = politicianCommitteesSeed as CommitteesSeed;

export function resolvePoliticianCommittees(
  politicianId: string,
  dbCommittees: string | null | undefined,
): string | null {
  const trimmed = String(dbCommittees || '').trim();
  if (trimmed) return trimmed;
  const fromSeed = seedByPoliticianId[politicianId];
  return fromSeed && String(fromSeed).trim() ? String(fromSeed).trim() : null;
}

export function resolveIssuerTradeSector(ticker: string | null | undefined, issuerSector: string | null | undefined) {
  const fromDb = normalizeToTargetSector(issuerSector);
  if (fromDb) return fromDb;
  const sym = String(ticker || '')
    .trim()
    .toUpperCase();
  if (!sym) return null;
  return TICKER_TO_SECTOR[sym] ?? null;
}
