import {
  SUBSECTOR_BY_SLUG,
  SUBSECTORS_BY_PARENT,
} from '@/lib/industrySubsectorTaxonomy';

export type IndustrySegmentTone = 'buy' | 'sell' | 'mixed' | 'neutral';

export type IndustryChainSegmentDto = {
  nameKey: string;
  name: string;
  tone: IndustrySegmentTone;
  buyPct?: number;
  buyAmount?: number;
  sellAmount?: number;
};

export type IndustryChainNodeDto = {
  nameKey: string;
  name: string;
  buyPct: number;
  sellPct: number;
  netAmount: number;
  buyAmount: number;
  sellAmount: number;
  segments?: IndustryChainSegmentDto[];
};

type Flow = { buy: number; sell: number };

export type BuildIndustryChainOptions = {
  /**
   * Insider mode: chain nodes show sector buy/sell flow; sub-nodes are taxonomy
   * sentiment (like politician UI), not dollar allocation per sub-sector.
   */
  syntheticSegments?: boolean;
};

function hashTone(seed: string, index: number): number {
  let h = 0;
  const s = `${seed}-${index}`;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Sub-node tone from parent sector flow (matches mobile enrichIndustryChain). */
function syntheticSegmentTone(
  buyPct: number,
  sellPct: number,
  index: number,
  parentKey: string,
): IndustrySegmentTone {
  const h = hashTone(parentKey, index);
  if (h % 5 === 0 || (index > 2 && h % 3 === 0)) return 'neutral';
  const jitter = (h % 21) - 10;
  const buy = Math.min(100, Math.max(0, buyPct + jitter));
  const sell = Math.min(100, Math.max(0, sellPct - jitter));
  const total = buy + sell;
  if (total < 12) return 'neutral';
  if (buy > 22 && sell > 22) return 'mixed';
  return buy >= sell ? 'buy' : 'sell';
}

function buildSyntheticSegments(
  parentSector: string,
  buyPct: number,
  sellPct: number,
): IndustryChainSegmentDto[] {
  const taxonomy =
    SUBSECTORS_BY_PARENT.get(parentSector) ||
    SUBSECTORS_BY_PARENT.get('Other') ||
    [];
  return taxonomy.map((d, i) => {
    const tone = syntheticSegmentTone(buyPct, sellPct, i, parentSector);
    const mixedBuy =
      tone === 'mixed'
        ? 35 + (hashTone(parentSector, i) % 30)
        : tone === 'buy'
          ? 88
          : tone === 'sell'
            ? 12
            : 50;
    return {
      nameKey: d.slug,
      name: d.name_en,
      tone,
      buyPct: mixedBuy,
    };
  });
}

function segmentTone(buy: number, sell: number): IndustrySegmentTone {
  const total = buy + sell;
  if (total < 1) return 'neutral';
  const buyPct = (buy / total) * 100;
  const sellPct = (sell / total) * 100;
  if (buyPct > 22 && sellPct > 22) return 'mixed';
  return buy >= sell ? 'buy' : 'sell';
}

function toSegment(
  slug: string,
  flow: Flow,
): IndustryChainSegmentDto {
  const def = SUBSECTOR_BY_SLUG.get(slug);
  const total = flow.buy + flow.sell || 1;
  const buyPct = Math.round((flow.buy / total) * 100);
  return {
    nameKey: slug,
    name: def?.name_en ?? slug,
    tone: segmentTone(flow.buy, flow.sell),
    buyPct,
    buyAmount: flow.buy,
    sellAmount: flow.sell,
  };
}

function buildSegmentsForSector(
  parentSector: string,
  subFlows: Map<string, Flow>,
): IndustryChainSegmentDto[] {
  const taxonomy = SUBSECTORS_BY_PARENT.get(parentSector) || [];
  const fromTrades: IndustryChainSegmentDto[] = [];

  for (const [slug, flow] of subFlows.entries()) {
    if (slug === '__unassigned__') continue;
    if (flow.buy + flow.sell < 1) continue;
    fromTrades.push(toSegment(slug, flow));
  }

  fromTrades.sort(
    (a, b) =>
      (b.buyAmount ?? 0) +
      (b.sellAmount ?? 0) -
      ((a.buyAmount ?? 0) + (a.sellAmount ?? 0)),
  );

  if (fromTrades.length > 0) return fromTrades;

  // No sub-sector assignments yet: show taxonomy placeholders (neutral)
  return taxonomy.slice(0, 6).map((d) => ({
    nameKey: d.slug,
    name: d.name_en,
    tone: 'neutral' as const,
    buyPct: 50,
    buyAmount: 0,
    sellAmount: 0,
  }));
}

export function buildIndustryChainNodes(
  sectorAgg: Map<string, Flow>,
  subsectorAgg: Map<string, Map<string, Flow>>,
  limit = 6,
  options?: BuildIndustryChainOptions,
): IndustryChainNodeDto[] {
  const synthetic = options?.syntheticSegments ?? false;
  return [...sectorAgg.entries()]
    .map(([nameKey, flow]) => ({
      nameKey,
      name: nameKey,
      buyAmount: flow.buy,
      sellAmount: flow.sell,
    }))
    .sort(
      (a, b) =>
        b.buyAmount + b.sellAmount - (a.buyAmount + a.sellAmount),
    )
    .slice(0, limit)
    .map((ind) => {
      const total = ind.buyAmount + ind.sellAmount || 1;
      const buyPct = Math.round((ind.buyAmount / total) * 100);
      const sellPct = Math.round((ind.sellAmount / total) * 100);
      const subFlows = subsectorAgg.get(ind.nameKey) || new Map<string, Flow>();
      return {
        nameKey: ind.nameKey,
        name: ind.name,
        buyPct,
        sellPct,
        netAmount: ind.buyAmount - ind.sellAmount,
        buyAmount: ind.buyAmount,
        sellAmount: ind.sellAmount,
        segments: synthetic
          ? buildSyntheticSegments(ind.nameKey, buyPct, sellPct)
          : buildSegmentsForSector(ind.nameKey, subFlows),
      };
    });
}

export function accumulateSectorFlows(
  rows: {
    sector: string;
    subsectorSlug: string | null;
    buy: number;
    sell: number;
  }[],
): {
  sectorAgg: Map<string, Flow>;
  subsectorAgg: Map<string, Map<string, Flow>>;
} {
  const sectorAgg = new Map<string, Flow>();
  const subsectorAgg = new Map<string, Map<string, Flow>>();

  for (const row of rows) {
    const sector = row.sector || 'Other';
    const sectorCur = sectorAgg.get(sector) || { buy: 0, sell: 0 };
    sectorCur.buy += row.buy;
    sectorCur.sell += row.sell;
    sectorAgg.set(sector, sectorCur);

    const subKey = row.subsectorSlug || '__unassigned__';
    const byParent = subsectorAgg.get(sector) || new Map<string, Flow>();
    const subCur = byParent.get(subKey) || { buy: 0, sell: 0 };
    subCur.buy += row.buy;
    subCur.sell += row.sell;
    byParent.set(subKey, subCur);
    subsectorAgg.set(sector, byParent);
  }

  return { sectorAgg, subsectorAgg };
}
