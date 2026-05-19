import { describe, expect, it } from 'vitest';
import {
  buildCongressClusterKeys,
  computePoliticianTradeFlags,
  isCommitteeSectorTrade,
  NOTABLE_SIZE_USD,
} from './tradeFlags';

describe('tradeFlags', () => {
  it('flags notable size', () => {
    const flags = computePoliticianTradeFlags(
      {
        id: '1',
        politicianId: 'p1',
        ticker: 'NVDA',
        side: 'buy',
        amountUsd: NOTABLE_SIZE_USD,
      },
      new Set(),
    );
    expect(flags).toContain('notable_size');
  });

  it('flags congress cluster when enough members', () => {
    const cluster = buildCongressClusterKeys([
      { politicianId: 'a', ticker: 'AAPL', side: 'buy' },
      { politicianId: 'b', ticker: 'AAPL', side: 'buy' },
      { politicianId: 'c', ticker: 'AAPL', side: 'buy' },
    ]);
    expect(cluster.has('AAPL|buy')).toBe(true);
    const flags = computePoliticianTradeFlags(
      {
        id: '1',
        politicianId: 'a',
        ticker: 'AAPL',
        side: 'buy',
        amountUsd: 1000,
      },
      cluster,
    );
    expect(flags).toContain('congress_cluster');
  });

  it('detects committee-sector overlap', () => {
    expect(
      isCommitteeSectorTrade({
        politicianId: 'p-energy',
        committees: 'Senate Energy and Natural Resources',
        ticker: 'XOM',
        issuerSector: 'Energy',
      }),
    ).toBe(true);
  });

  it('detects banking committee + bank ticker without issuer sector', () => {
    expect(
      isCommitteeSectorTrade({
        politicianId: 'p-bank',
        committees: 'Senate Banking, Housing, and Urban Affairs',
        ticker: 'JPM',
        issuerSector: null,
      }),
    ).toBe(true);
  });
});
