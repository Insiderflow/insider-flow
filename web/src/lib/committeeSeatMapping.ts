import type { SectorName } from '@/lib/politiciansBySector';
import type { CommitteeAssignment } from '@/lib/govtrackCommitteeSectors';
import {
  normalizeCommitteeAssignments,
  sectorsForCommitteeAssignments,
} from '@/lib/govtrackCommitteeSectors';

/** Regex fallback when GovTrack codes are not stored (legacy `committees` text only). */
const COMMITTEE_PHRASES: { pattern: RegExp; sectors: SectorName[] }[] = [
  {
    pattern: /financial\s+services|house\s+financial|senate\s+banking|banking|ways\s+and\s+means|finance/i,
    sectors: ['Financials'],
  },
  {
    pattern: /energy\s+and\s+(natural\s+resources|commerce)|natural\s+resources|energy/i,
    sectors: ['Energy', 'Utilities'],
  },
  {
    pattern: /commerce|communications|telecommunications|science,?\s+space/i,
    sectors: ['Communication Services', 'Information Technology', 'Consumer Discretionary'],
  },
  {
    pattern: /armed\s+services|national\s+security|homeland\s+security|transportation|infrastructure|aviation/i,
    sectors: ['Industrials'],
  },
  {
    pattern: /health|help|medicare|medicaid|human\s+services/i,
    sectors: ['Health Care'],
  },
  {
    pattern: /agriculture|nutrition|forestry/i,
    sectors: ['Consumer Staples', 'Materials'],
  },
  {
    pattern: /intelligence/i,
    sectors: ['Communication Services', 'Industrials'],
  },
  {
    pattern: /housing|urban\s+affairs/i,
    sectors: ['Real Estate', 'Financials'],
  },
  {
    pattern: /environment|climate|public\s+works/i,
    sectors: ['Utilities', 'Materials', 'Industrials'],
  },
  {
    pattern: /small\s+business|entrepreneurship/i,
    sectors: ['Consumer Discretionary', 'Financials'],
  },
];

const KEYWORD_RULES: { sector: SectorName; keywords: string[] }[] = [
  { sector: 'Information Technology', keywords: ['science', 'technology', 'cyber', 'innovation'] },
  { sector: 'Financials', keywords: ['finance', 'financial services', 'banking'] },
  { sector: 'Industrials', keywords: ['transportation', 'infrastructure', 'defense', 'armed'] },
  { sector: 'Health Care', keywords: ['health', 'healthcare', 'public health'] },
  { sector: 'Consumer Discretionary', keywords: ['small business', 'tourism'] },
  { sector: 'Communication Services', keywords: ['intelligence', 'communications', 'telecommunications'] },
  { sector: 'Consumer Staples', keywords: ['agriculture', 'food'] },
  { sector: 'Energy', keywords: ['energy', 'natural resources', 'oil', 'gas'] },
  { sector: 'Materials', keywords: ['environment', 'mining'] },
  { sector: 'Real Estate', keywords: ['housing', 'urban affairs', 'real estate'] },
  { sector: 'Utilities', keywords: ['utilities', 'electric'] },
];

function sectorsFromPhrase(text: string): SectorName[] {
  const out: SectorName[] = [];
  for (const { pattern, sectors } of COMMITTEE_PHRASES) {
    if (pattern.test(text) && sectors.length) out.push(...sectors);
  }
  const lower = text.toLowerCase();
  for (const rule of KEYWORD_RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw))) out.push(rule.sector);
  }
  return out;
}

export function splitCommitteeNames(committees: string | null | undefined): string[] {
  const raw = String(committees || '').trim();
  if (!raw) return [];
  const parts = raw
    .split(/[;\n|]+/)
    .flatMap((chunk) => chunk.split(/,(?=\s*[A-Z])/))
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  return parts.length ? [...new Set(parts)] : [raw];
}

/** Preferred: GovTrack committee codes (standing + subcommittee). */
export function inferSeatSectorsFromAssignments(
  assignments: CommitteeAssignment[] | null | undefined,
): SectorName[] {
  const normalized = normalizeCommitteeAssignments(assignments);
  if (!normalized.length) return [];
  return sectorsForCommitteeAssignments(normalized);
}

export function inferSeatSectorsFromCommittees(
  committees: string | null | undefined,
  assignments?: CommitteeAssignment[] | null,
): SectorName[] {
  const fromCodes = inferSeatSectorsFromAssignments(assignments);
  if (fromCodes.length) return fromCodes;

  const segments = splitCommitteeNames(committees);
  if (!segments.length) return [];

  const found = new Set<SectorName>();
  for (const segment of segments) {
    for (const sector of sectorsFromPhrase(segment)) found.add(sector);
  }
  for (const sector of sectorsFromPhrase(String(committees || ''))) found.add(sector);
  return [...found];
}

export function inferSeatSectorFromCommittees(
  committees: string | null | undefined,
  assignments?: CommitteeAssignment[] | null,
): SectorName | null {
  return inferSeatSectorsFromCommittees(committees, assignments)[0] ?? null;
}
