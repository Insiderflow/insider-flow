import { describe, expect, it } from 'vitest';
import {
  defaultSignalsLimit,
  defaultTierForPeriod,
  passesTierFilter,
} from './signalsBuilder';

describe('signalsBuilder tier filter', () => {
  it('medium_plus keeps high and medium', () => {
    expect(passesTierFilter('medium_plus', 'high')).toBe(true);
    expect(passesTierFilter('medium_plus', 'medium')).toBe(true);
    expect(passesTierFilter('medium_plus', 'low')).toBe(false);
  });

  it('high keeps only high', () => {
    expect(passesTierFilter('high', 'high')).toBe(true);
    expect(passesTierFilter('high', 'medium')).toBe(false);
  });

  it('defaults 1D to medium_plus with lower cap', () => {
    expect(defaultTierForPeriod('1D')).toBe('medium_plus');
    expect(defaultSignalsLimit('1D')).toBe(25);
    expect(defaultTierForPeriod('7D')).toBe('all');
    expect(defaultSignalsLimit('7D')).toBe(40);
  });
});
