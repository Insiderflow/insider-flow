import { describe, expect, it } from 'vitest';
import {
  computeMlSignalScore,
  tradeAmountPercentile,
} from './signalMlScorer';

describe('signalMlScorer', () => {
  it('ranks high cluster + unusual size above thin notable-only', () => {
    const rich = computeMlSignalScore({
      flagScore: 55,
      flags: ['congress_cluster', 'committee_sector', 'notable_size'],
      sizePercentile: 0.92,
      clusterSize: 5,
      daysSincePublished: 0,
      filedAfterDays: 60,
    });
    const thin = computeMlSignalScore({
      flagScore: 15,
      flags: ['notable_size'],
      sizePercentile: 0.4,
      clusterSize: 0,
      daysSincePublished: 10,
      filedAfterDays: 10,
    });
    expect(rich.mlScore).toBeGreaterThan(thin.mlScore);
    expect(rich.mlTier).toBe('high');
  });

  it('computes amount percentile against politician history', () => {
    expect(tradeAmountPercentile(75_000, [10_000, 50_000, 100_000, 800_000])).toBe(0.5);
    expect(tradeAmountPercentile(900_000, [10_000, 50_000, 100_000, 800_000])).toBe(1);
    expect(tradeAmountPercentile(2_000_000, [10_000, 50_000])).toBe(1);
    expect(tradeAmountPercentile(0, [10_000])).toBe(0);
  });
});
