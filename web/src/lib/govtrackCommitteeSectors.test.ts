import { describe, expect, it } from 'vitest';
import {
  normalizeGovtrackCode,
  sectorsForCommitteeAssignments,
  sectorsForGovtrackCode,
} from '@/lib/govtrackCommitteeSectors';

describe('govtrackCommitteeSectors', () => {
  it('normalizes GovTrack URL slugs', () => {
    expect(normalizeGovtrackCode('/congress/committees/ssbk')).toBe('SSBK');
  });

  it('maps Senate Banking to Financials', () => {
    expect(sectorsForGovtrackCode('SSBK')).toContain('Financials');
  });

  it('maps Energy subcommittee HSIF03 to Energy', () => {
    expect(sectorsForGovtrackCode('HSIF03')).toContain('Energy');
  });

  it('maps assignments via static table (not regex)', () => {
    const sectors = sectorsForCommitteeAssignments([
      { code: 'SSBK', name: 'Senate Banking' },
      { code: 'HSIF16', name: 'Communications and Technology' },
    ]);
    expect(sectors).toContain('Financials');
    expect(sectors).toContain('Communication Services');
  });
});
