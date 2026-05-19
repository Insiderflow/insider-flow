import type { SectorName } from '@/lib/politiciansBySector';
import govtrackData from '@/data/govtrackCommitteeSectors.json';

export type CommitteeAssignment = {
  code: string;
  name?: string;
  parentCode?: string | null;
};

type MapEntry = {
  sectors: SectorName[];
  name?: string;
  parentCode?: string;
};

const ENTRIES = govtrackData.entries as Record<string, MapEntry>;
const STANDING_CODES = new Set(
  Object.entries(ENTRIES)
    .filter(([, e]) => !e.parentCode)
    .map(([k]) => k),
);

export function normalizeGovtrackCode(code: string): string {
  return String(code || '')
    .trim()
    .toUpperCase()
    .replace(/^\/congress\/committees\//i, '');
}

export function inferParentGovtrackCode(code: string): string | null {
  const c = normalizeGovtrackCode(code);
  const direct = ENTRIES[c]?.parentCode;
  if (direct) return direct;
  if (STANDING_CODES.has(c)) return null;
  let best: string | null = null;
  for (const standing of STANDING_CODES) {
    if (c.startsWith(standing) && standing.length > (best?.length ?? 0)) {
      best = standing;
    }
  }
  return best;
}

export function sectorsForGovtrackCode(code: string): SectorName[] {
  const c = normalizeGovtrackCode(code);
  const entry = ENTRIES[c];
  if (entry?.sectors?.length) return [...entry.sectors];
  const parent = inferParentGovtrackCode(c);
  if (parent && ENTRIES[parent]?.sectors?.length) {
    return [...ENTRIES[parent].sectors];
  }
  return [];
}

export function sectorsForCommitteeAssignments(
  assignments: CommitteeAssignment[],
): SectorName[] {
  const found = new Set<SectorName>();
  for (const a of assignments) {
    for (const s of sectorsForGovtrackCode(a.code)) {
      found.add(s);
    }
  }
  return [...found];
}

export function normalizeCommitteeAssignments(
  raw: unknown,
): CommitteeAssignment[] {
  if (!Array.isArray(raw)) return [];
  const out: CommitteeAssignment[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const code = normalizeGovtrackCode(String((item as CommitteeAssignment).code || ''));
    if (!code) continue;
    out.push({
      code,
      name: (item as CommitteeAssignment).name,
      parentCode:
        (item as CommitteeAssignment).parentCode != null
          ? normalizeGovtrackCode(String((item as CommitteeAssignment).parentCode))
          : inferParentGovtrackCode(code),
    });
  }
  return out;
}

export function govtrackEntryLabel(code: string): string | undefined {
  return ENTRIES[normalizeGovtrackCode(code)]?.name;
}
