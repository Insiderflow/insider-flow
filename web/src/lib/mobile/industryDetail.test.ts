import { describe, expect, it } from 'vitest';
import { buildIndustryDetail } from './industryDetail';

describe('industryDetail', () => {
  const issuer = new Map([
    ['ODTX', { ticker: 'ODTX', sector: 'HealthCare' }],
    ['FCNCA', { ticker: 'FCNCA', sector: 'Financials' }],
  ]);

  it('aggregates companies in sector for buy side', () => {
    const rows = [
      {
        transactionType: 'P-Purchase',
        valueNumeric: 1_000_000,
        ownerId: 'o1',
        owner: { name: 'Alice', title: 'Director' },
        company: { ticker: 'ODTX', name: 'Odyssey Therapeutics' },
      },
      {
        transactionType: 'P-Purchase',
        valueNumeric: 500_000,
        ownerId: 'o2',
        owner: { name: 'Bob', title: 'CEO' },
        company: { ticker: 'ODTX', name: 'Odyssey Therapeutics' },
      },
    ];

    const detail = buildIndustryDetail(rows, issuer, 'HealthCare', 'buy');
    expect(detail.companies).toHaveLength(1);
    expect(detail.companies[0].ticker).toBe('ODTX');
    expect(detail.companies[0].amount).toBe(1_500_000);
    expect(detail.companies[0].tradeCount).toBe(2);
    expect(detail.companies[0].insiderCount).toBe(2);
  });

  it('excludes institutional 10% filers', () => {
    const rows = [
      {
        transactionType: 'P-Purchase',
        valueNumeric: 9_000_000,
        ownerId: 'b1',
        owner: { name: 'Goldman Sachs Group Inc', title: '10%' },
        company: { ticker: 'ODTX', name: 'Odyssey' },
      },
    ];
    const detail = buildIndustryDetail(rows, issuer, 'HealthCare', 'buy');
    expect(detail.companies).toHaveLength(0);
  });
});
