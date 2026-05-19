import { describe, expect, it } from 'vitest';
import {
  computeSignalRecommendation,
  passesRecommendationFilter,
} from './signalRecommendation';

describe('signalRecommendation', () => {
  it('proposed sale is always hold', () => {
    expect(
      computeSignalRecommendation({ side: 'proposed_sale', mlTier: 'high' }),
    ).toBe('hold');
  });

  it('low tier is hold even on buy/sell', () => {
    expect(computeSignalRecommendation({ side: 'buy', mlTier: 'low' })).toBe(
      'hold',
    );
    expect(computeSignalRecommendation({ side: 'sell', mlTier: 'low' })).toBe(
      'hold',
    );
  });

  it('medium+ buy → buy, medium+ sell → sell', () => {
    expect(computeSignalRecommendation({ side: 'buy', mlTier: 'medium' })).toBe(
      'buy',
    );
    expect(computeSignalRecommendation({ side: 'buy', mlTier: 'high' })).toBe(
      'buy',
    );
    expect(computeSignalRecommendation({ side: 'sell', mlTier: 'high' })).toBe(
      'sell',
    );
  });

  it('filters by recommendation not trade side', () => {
    expect(passesRecommendationFilter('hold', 'hold')).toBe(true);
    expect(passesRecommendationFilter('buy', 'hold')).toBe(false);
    expect(passesRecommendationFilter('buy', 'buy')).toBe(true);
  });
});
