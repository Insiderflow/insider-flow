import { describe, expect, it } from 'vitest';
import {
  buildCongressClusterKeys,
  computePoliticianTradeFlags,
  NOTABLE_SIZE_USD,
} from './tradeFlags';

describe('signals scoring', () => {
  it('ranks cluster + committee above notable-only', () => {
    const cluster = buildCongressClusterKeys([
      { politicianId: 'a', ticker: 'NVDA', side: 'buy' },
      { politicianId: 'b', ticker: 'NVDA', side: 'buy' },
      { politicianId: 'c', ticker: 'NVDA', side: 'buy' },
    ]);

    const rich = computePoliticianTradeFlags(
      {
        id: '1',
        politicianId: 'a',
        ticker: 'NVDA',
        side: 'buy',
        amountUsd: NOTABLE_SIZE_USD,
        committees: 'Senate Energy and Natural Resources',
        issuerSector: 'Energy',
      },
      cluster,
    );

    const thin = computePoliticianTradeFlags(
      {
        id: '2',
        politicianId: 'x',
        ticker: 'XYZ',
        side: 'buy',
        amountUsd: 5000,
      },
      cluster,
    );

    expect(rich.length).toBeGreaterThan(thin.length);
  });
});
