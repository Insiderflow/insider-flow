import { describe, expect, it } from 'vitest';
import { buildCommitteeSectorSummary } from './committeeSectorBuilder';

describe('buildCommitteeSectorSummary', () => {
  it('aggregates committee-aligned trades by sector', () => {
    const summary = buildCommitteeSectorSummary([
      {
        politicianId: 'p1',
        committees: 'Senate Energy and Natural Resources',
        ticker: 'XOM',
        issuerSector: 'Energy',
        type: 'purchase',
        amountUsd: 2_000_000,
      },
      {
        politicianId: 'p2',
        committees: 'Senate Banking',
        ticker: 'XOM',
        issuerSector: 'Energy',
        type: 'purchase',
        amountUsd: 500_000,
      },
    ]);
    expect(summary.alignedVolume).toBe(2_000_000);
    expect(summary.rows[0]?.sectorKey).toBe('Energy');
    expect(summary.rows[0]?.buyAmount).toBe(2_000_000);
  });
});
