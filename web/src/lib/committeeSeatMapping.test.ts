import { describe, expect, it } from 'vitest';
import {
  inferSeatSectorsFromCommittees,
  splitCommitteeNames,
} from '@/lib/committeeSeatMapping';

describe('committeeSeatMapping', () => {
  it('splits semicolon-separated committee names', () => {
    expect(
      splitCommitteeNames(
        'Senate Banking; Senate Energy and Natural Resources',
      ),
    ).toEqual(['Senate Banking', 'Senate Energy and Natural Resources']);
  });

  it('maps energy committee and energy ticker sector', () => {
    const sectors = inferSeatSectorsFromCommittees(
      'Senate Energy and Natural Resources',
    );
    expect(sectors).toContain('Energy');
  });

  it('maps financial services committee to Financials', () => {
    expect(
      inferSeatSectorsFromCommittees('House Committee on Financial Services'),
    ).toContain('Financials');
  });

  it('union sectors from multiple committees', () => {
    const sectors = inferSeatSectorsFromCommittees(
      'Senate Banking; House Committee on Science, Space, and Technology',
    );
    expect(sectors).toContain('Financials');
    expect(sectors).toContain('Information Technology');
  });

  it('uses GovTrack assignment codes when provided', () => {
    const sectors = inferSeatSectorsFromCommittees(null, [
      { code: 'HSIF03', name: 'Energy' },
    ]);
    expect(sectors).toContain('Energy');
  });
});
