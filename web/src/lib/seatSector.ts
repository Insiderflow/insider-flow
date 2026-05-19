import type { SectorName } from '@/lib/politiciansBySector';
import { normalizeToTargetSector } from '@/lib/politiciansBySector';
import type { CommitteeAssignment } from '@/lib/govtrackCommitteeSectors';
import { normalizeCommitteeAssignments } from '@/lib/govtrackCommitteeSectors';
import {
  inferSeatSectorFromCommittees,
  inferSeatSectorsFromCommittees,
  splitCommitteeNames,
} from '@/lib/committeeSeatMapping';
import {
  gicsSectorFromTaxonomyParent,
  inferSubsectorSlug,
  SUBSECTOR_BY_SLUG,
} from '@/lib/industrySubsectorTaxonomy';
import politicianCommitteesSeed from '@/data/politician_committees.seed.json';

export {
  inferSeatSectorFromCommittees,
  inferSeatSectorsFromCommittees,
  splitCommitteeNames,
};

/** GICS sector for well-known tickers when Issuer.sector is missing in DB. */
const TICKER_TO_SECTOR: Partial<Record<string, SectorName>> = {
  AAPL: 'Information Technology',
  MSFT: 'Information Technology',
  NVDA: 'Information Technology',
  AMD: 'Information Technology',
  INTC: 'Information Technology',
  CRM: 'Information Technology',
  ORCL: 'Information Technology',
  AVGO: 'Information Technology',
  QCOM: 'Information Technology',
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
  WFC: 'Financials',
  C: 'Financials',
  XOM: 'Energy',
  CVX: 'Energy',
  COP: 'Energy',
  SLB: 'Energy',
  PFE: 'Health Care',
  JNJ: 'Health Care',
  UNH: 'Health Care',
  LLY: 'Health Care',
  MRK: 'Health Care',
  WMT: 'Consumer Staples',
  PG: 'Consumer Staples',
  KO: 'Consumer Staples',
  PEP: 'Consumer Staples',
  AMZN: 'Consumer Discretionary',
  TSLA: 'Consumer Discretionary',
  HD: 'Consumer Discretionary',
  NKE: 'Consumer Discretionary',
  BA: 'Industrials',
  CAT: 'Industrials',
  LMT: 'Industrials',
  RTX: 'Industrials',
  GLD: 'Materials',
  NEE: 'Utilities',
  DUK: 'Utilities',
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

export function resolveIssuerTradeSector(
  ticker: string | null | undefined,
  issuerSector: string | null | undefined,
  subSectorSlug?: string | null,
): SectorName | null {
  const fromDb = normalizeToTargetSector(issuerSector);
  if (fromDb) return fromDb;

  const slug =
    subSectorSlug ||
    inferSubsectorSlug({ ticker, sector: issuerSector }) ||
    null;
  if (slug) {
    const def = SUBSECTOR_BY_SLUG.get(slug);
    if (def) {
      const fromParent = gicsSectorFromTaxonomyParent(def.parent_sector);
      if (fromParent) return fromParent;
    }
  }

  const sym = String(ticker || '')
    .trim()
    .toUpperCase();
  if (!sym) return null;
  return TICKER_TO_SECTOR[sym] ?? null;
}

export type CommitteeSectorAlignment = {
  committees: string | null;
  committeeNames: string[];
  committeeAssignments: CommitteeAssignment[];
  committeeCodes: string[];
  committeeSectors: SectorName[];
  tradeSector: SectorName | null;
  met: boolean;
  usedGovtrackMap: boolean;
};

export function explainCommitteeSectorAlignment(input: {
  politicianId: string;
  committees?: string | null;
  committeeAssignments?: unknown;
  ticker?: string | null;
  issuerSector?: string | null;
  subSectorSlug?: string | null;
}): CommitteeSectorAlignment {
  const committees = resolvePoliticianCommittees(
    input.politicianId,
    input.committees,
  );
  const committeeAssignments = normalizeCommitteeAssignments(
    input.committeeAssignments,
  );
  const committeeNames =
    committeeAssignments.length > 0
      ? committeeAssignments.map((a) => a.name || a.code)
      : splitCommitteeNames(committees);
  const committeeCodes = committeeAssignments.map((a) => a.code);
  const committeeSectors = inferSeatSectorsFromCommittees(
    committees,
    committeeAssignments,
  );
  const usedGovtrackMap = committeeAssignments.length > 0;
  const tradeSector = resolveIssuerTradeSector(
    input.ticker,
    input.issuerSector,
    input.subSectorSlug,
  );
  const met = Boolean(
    tradeSector && committeeSectors.length > 0 && committeeSectors.includes(tradeSector),
  );
  return {
    committees,
    committeeNames,
    committeeAssignments,
    committeeCodes,
    committeeSectors,
    tradeSector,
    met,
    usedGovtrackMap,
  };
}

/** Committee seat sector first; else GICS sector of the trade's issuer/ticker. */
export function resolvePoliticianSeatSector(
  politicianId: string,
  dbCommittees: string | null | undefined,
  tradeTicker?: string | null,
  issuerSector?: string | null,
  subSectorSlug?: string | null,
): SectorName | null {
  const committees = resolvePoliticianCommittees(politicianId, dbCommittees);
  const fromSeat = inferSeatSectorFromCommittees(committees);
  if (fromSeat) return fromSeat;
  return resolveIssuerTradeSector(tradeTicker, issuerSector, subSectorSlug);
}

export function politicianSeatDisplayTitle(sector: SectorName | null): string {
  return sector ?? 'Other';
}
