import type { IndustryChainNode, IndustryChainSegment, IndustrySegmentTone } from '@/data/mockData';

/** Sub-industry keys per parent sector (localized via mock.industries). */
export const INDUSTRY_SEGMENT_LIBRARY: Record<string, string[]> = {
  Semiconductor: [
    'Semiconductor Equipment & Materials',
    'Semiconductors',
    'Semiconductor Memory',
    'Electronic Components',
    'Computer Hardware',
    'Consumer Electronics',
    'Data Storage',
  ],
  Semiconductors: [
    'Semiconductor Equipment & Materials',
    'Semiconductors',
    'Semiconductor Memory',
    'Electronic Components',
    'Computer Hardware',
    'Consumer Electronics',
    'Data Storage',
  ],
  Software: ['Software - Infrastructure', 'Software - Application'],
  'Oil & Gas': [
    'Oil & Gas Drilling',
    'Oil & Gas E&P',
    'Oil & Gas Equipment & Services',
    'Oil & Gas Midstream',
    'Oil & Gas Integrated',
    'Oil & Gas Refining & Marketing',
  ],
  Biotechnology: ['Gene Therapy', 'Devices', 'Pharma', 'Diagnostics'],
  'Banks - Regional': ['Lending', 'Wealth', 'Payments', 'Insurance'],
  Aerospace: ['Defense', 'Commercial', 'Space', 'Components'],
  Energy: ['Oil & Gas', 'Utilities', 'Renewables', 'Coal'],
  Healthcare: ['Pharma', 'Hospitals', 'Devices', 'Biotech'],
  Financials: ['Banks', 'Asset Mgmt', 'Insurance', 'Fintech'],
  InformationTechnology: ['Semiconductor', 'Software', 'Hardware', 'IT Services'],
  'Food & Agriculture': ['Protein', 'Crop Science', 'Packaged Food', 'Ag Equipment'],
  Other: ['Industrials', 'Materials', 'Real Estate', 'Consumer'],
  'N/A': ['Mixed', 'Private', 'Funds', 'Other'],
};

function hashTone(seed: string, index: number): number {
  let h = 0;
  const s = `${seed}-${index}`;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function segmentTone(
  buyPct: number,
  sellPct: number,
  index: number,
  parentKey: string
): IndustrySegmentTone {
  const h = hashTone(parentKey, index);
  // Downstream segments more often inactive (hollow) like reference UI
  if (h % 5 === 0 || (index > 2 && h % 3 === 0)) return 'neutral';
  const jitter = (h % 21) - 10;
  const buy = Math.min(100, Math.max(0, buyPct + jitter));
  const sell = Math.min(100, Math.max(0, sellPct - jitter));
  const total = buy + sell;
  if (total < 12) return 'neutral';
  if (buy > 22 && sell > 22) return 'mixed';
  return buy >= sell ? 'buy' : 'sell';
}

/** Split segments into 1→N columns for upstream→downstream flow. */
export function splitSegmentsIntoColumns<T>(items: T[]): T[][] {
  const n = items.length;
  if (n === 0) return [];
  if (n === 1) return [items];
  if (n === 2) return [items.slice(0, 1), items.slice(1, 2)];

  const sizes = columnSizes(n);
  const cols: T[][] = [];
  let idx = 0;
  for (const size of sizes) {
    if (size > 0) cols.push(items.slice(idx, idx + size));
    idx += size;
  }
  return cols;
}

function columnSizes(n: number): number[] {
  if (n === 3) return [1, 1, 1];
  if (n === 4) return [1, 2, 1];
  if (n === 5) return [1, 2, 2];
  if (n === 6) return [1, 2, 3];
  const first = 1;
  const second = Math.max(1, Math.round((n - 1) * 0.3));
  const third = n - first - second;
  if (third < 1) return columnSizes(n - 1);
  return [first, second, third];
}

export function resolveChainAmounts(node: IndustryChainNode): {
  buyAmount: number;
  sellAmount: number;
} {
  if (node.buyAmount != null && node.sellAmount != null) {
    return { buyAmount: node.buyAmount, sellAmount: node.sellAmount };
  }
  const total =
    Math.abs(node.netAmount) > 0
      ? Math.abs(node.netAmount) * 1.6
      : 1_000_000;
  const buyAmount = Math.round((total * node.buyPct) / 100);
  const sellAmount = Math.round((total * node.sellPct) / 100);
  return { buyAmount, sellAmount };
}

export function enrichIndustryChainNode(node: IndustryChainNode): IndustryChainNode {
  const { buyAmount, sellAmount } = resolveChainAmounts(node);
  const hasLiveSegments = node.segments?.some(
    (s) => (s.buyAmount ?? 0) + (s.sellAmount ?? 0) > 0,
  );
  if (hasLiveSegments) {
    return {
      ...node,
      buyAmount,
      sellAmount,
      segments: node.segments!.map((s) => ({
        ...s,
        name: s.name ?? s.nameKey,
      })),
    };
  }
  if (node.segments?.length && node.segments.every((s) => s.tone)) {
    return {
      ...node,
      buyAmount,
      sellAmount,
      segments: node.segments.map((s) => ({
        ...s,
        name: s.name ?? s.nameKey,
      })),
    };
  }
  const keys =
    node.segments?.length
      ? node.segments.map((s) => s.nameKey)
      : INDUSTRY_SEGMENT_LIBRARY[node.nameKey] ||
        INDUSTRY_SEGMENT_LIBRARY.Other;

  const segments: IndustryChainSegment[] = keys.map((nameKey, i) => {
    const existing = node.segments?.find((s) => s.nameKey === nameKey);
    const tone =
      existing?.tone ??
      segmentTone(node.buyPct, node.sellPct, i, node.nameKey);
    const mixedBuy =
      tone === 'mixed'
        ? 35 + (hashTone(node.nameKey, i) % 30)
        : tone === 'buy'
          ? 88
          : tone === 'sell'
            ? 12
            : 50;
    return {
      nameKey,
      name: existing?.name ?? nameKey,
      tone,
      buyPct: existing?.buyPct ?? mixedBuy,
    };
  });

  return {
    ...node,
    buyAmount,
    sellAmount,
    segments,
  };
}

export function enrichIndustryChain(nodes: IndustryChainNode[]): IndustryChainNode[] {
  return nodes.map(enrichIndustryChainNode);
}
