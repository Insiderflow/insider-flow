import { describe, expect, it } from 'vitest';
import {
  brokerSlugFromName,
  buildPrimeBrokerSummaries,
  isPrimeBrokerFiler,
  normalizeBrokerDisplayName,
} from './primeBroker';

describe('primeBroker', () => {
  it('detects institutional 10% filers', () => {
    expect(isPrimeBrokerFiler('Goldman Sachs Group Inc', '10%')).toBe(true);
    expect(isPrimeBrokerFiler('Millennium Management LLC', '10%')).toBe(true);
    expect(isPrimeBrokerFiler('Ubs Group AG', 'Market maker/broker-dealer')).toBe(true);
    expect(isPrimeBrokerFiler('Meister Keith A.', 'Dir, 10%')).toBe(false);
    expect(isPrimeBrokerFiler('Kurtz George', 'Pres, CEO')).toBe(false);
  });

  it('normalizes display names', () => {
    expect(normalizeBrokerDisplayName('Goldman Sachs Group Inc')).toBe('Goldman Sachs');
  });

  it('aggregates broker flow by sector', () => {
    const summaries = buildPrimeBrokerSummaries(
      [
        {
          transactionType: 'P - Purchase',
          valueNumeric: 10_000_000,
          owner: { name: 'Morgan Stanley', title: '10%' },
          company: { ticker: 'NVDA' },
        },
        {
          transactionType: 'S - Sale',
          valueNumeric: 5_000_000,
          owner: { name: 'Morgan Stanley', title: '10%' },
          company: { ticker: 'XOM' },
        },
      ],
      new Map([
        ['NVDA', { ticker: 'NVDA', sector: 'InformationTechnology' }],
        ['XOM', { ticker: 'XOM', sector: 'Energy' }],
      ]),
    );
    expect(summaries).toHaveLength(1);
    expect(summaries[0].name).toBe('Morgan Stanley');
    expect(summaries[0].industryCount).toBe(2);
    expect(summaries[0].flowAmount).toBe(15_000_000);
    expect(brokerSlugFromName('Morgan Stanley')).toBe('morgan-stanley');
  });
});
