import { describe, expect, it } from 'vitest';
import {
  accumulateSectorFlows,
  buildIndustryChainNodes,
} from './industryChainBuilder';

describe('industryChainBuilder', () => {
  it('builds segments from sub-sector trade flow', () => {
    const { sectorAgg, subsectorAgg } = accumulateSectorFlows([
      {
        sector: 'InformationTechnology',
        subsectorSlug: 'it-semiconductors',
        buy: 0,
        sell: 1_000_000,
      },
      {
        sector: 'InformationTechnology',
        subsectorSlug: 'it-software-infrastructure',
        buy: 50_000,
        sell: 500_000,
      },
    ]);

    const chain = buildIndustryChainNodes(sectorAgg, subsectorAgg, 1);
    expect(chain).toHaveLength(1);
    expect(chain[0].segments?.length).toBeGreaterThanOrEqual(2);
    expect(chain[0].segments?.[0].tone).not.toBe('neutral');
  });

  it('falls back to taxonomy placeholders when no sub-sector data', () => {
    const { sectorAgg, subsectorAgg } = accumulateSectorFlows([
      { sector: 'Energy', subsectorSlug: null, buy: 0, sell: 4_000_000 },
    ]);
    const chain = buildIndustryChainNodes(sectorAgg, subsectorAgg, 1);
    expect(chain[0].segments?.every((s) => s.tone === 'neutral')).toBe(true);
  });

  it('syntheticSegments omits per-subsector dollar amounts', () => {
    const { sectorAgg, subsectorAgg } = accumulateSectorFlows([
      {
        sector: 'InformationTechnology',
        subsectorSlug: 'it-semiconductors',
        buy: 0,
        sell: 9_000_000,
      },
    ]);
    const chain = buildIndustryChainNodes(sectorAgg, subsectorAgg, 1, {
      syntheticSegments: true,
    });
    expect(chain[0].segments?.length).toBeGreaterThan(0);
    expect(chain[0].segments?.every((s) => s.buyAmount == null)).toBe(true);
  });
});
