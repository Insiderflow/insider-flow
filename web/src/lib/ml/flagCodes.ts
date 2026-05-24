import type { TradeFlagCode } from '@/lib/mobile/tradeFlags';
import type { MlReasonCode } from '@/lib/mobile/signalMlScorer';

/** Canonical trade flags (keep in sync with `ml/flag_codes.json` + Python analyzer). */
export const CANONICAL_TRADE_FLAG_CODES = [
  'notable_size',
  'committee_sector',
  'congress_cluster',
  'insider_cluster',
] as const;

export type CanonicalTradeFlagCode = (typeof CANONICAL_TRADE_FLAG_CODES)[number];

/** Raw flags emitted by Python before normalization. */
const PYTHON_FLAG_ALIASES: Record<string, TradeFlagCode | CanonicalTradeFlagCode> = {
  cluster_buy: 'congress_cluster',
  cluster_sell: 'congress_cluster',
  insider_cluster_buy: 'insider_cluster',
  insider_cluster_sell: 'insider_cluster',
  large_size: 'notable_size',
};

const VALID_TRADE_FLAGS = new Set<string>([
  'notable_size',
  'committee_sector',
  'congress_cluster',
  'insider_cluster',
]);

export function normalizeTradeFlags(raw: string[] | undefined): TradeFlagCode[] {
  if (!raw?.length) return [];
  const out: TradeFlagCode[] = [];
  for (const f of raw) {
    const key = String(f || '').trim();
    if (!key || key === 'ml_anomaly' || key === 'executive') continue;
    const mapped = PYTHON_FLAG_ALIASES[key] ?? key;
    if (VALID_TRADE_FLAGS.has(mapped) && !out.includes(mapped as TradeFlagCode)) {
      out.push(mapped as TradeFlagCode);
    }
  }
  return out;
}

export function normalizeMlReasons(raw: string[] | undefined): MlReasonCode[] {
  const allowed: MlReasonCode[] = [
    'unusual_size',
    'congress_cluster',
    'committee_sector',
    'notable_size',
    'recent_filing',
    'late_disclosure',
  ];
  if (!raw?.length) return [];
  return [...new Set(raw.filter((r): r is MlReasonCode => allowed.includes(r as MlReasonCode)))];
}

export type MlTradePayload = {
  trade_key: string;
  ticker: string;
  person_name: string;
  side: string;
  source?: string;
  value_usd?: number | null;
  trade_date: string;
  flags: string[];
  ml_reasons?: string[];
  ml_anomaly?: boolean;
  ml_score?: number;
  signal_score?: number;
  return_5d_pct?: number | null;
  return_30d_pct?: number | null;
  cluster_id?: string | null;
  cluster_size?: number;
  title?: string;
  is_executive?: boolean;
};

export type NormalizedMlTrade = {
  tradeKey: string;
  ticker: string;
  personName: string;
  side: 'buy' | 'sell' | 'other';
  valueUsd: number | null;
  tradeDate: string;
  flags: TradeFlagCode[];
  mlReasons: MlReasonCode[];
  mlAnomaly: boolean;
  mlScore: number;
  signalScore: number;
  return5dPct: number | null;
  return30dPct: number | null;
  clusterId: string | null;
  clusterSize: number;
  isExecutive: boolean;
  feed: 'politician' | 'corporate';
};

export function normalizeMlTrade(raw: MlTradePayload): NormalizedMlTrade {
  const source = String(raw.source || '').toLowerCase();
  const flags = normalizeTradeFlags(raw.flags);
  const side = raw.side === 'buy' || raw.side === 'sell' ? raw.side : 'other';

  if (raw.flags?.includes('cluster_buy') || raw.flags?.includes('cluster_sell')) {
    const clusterFlag: TradeFlagCode =
      source === 'capitoltrades' ? 'congress_cluster' : 'insider_cluster';
    if (!flags.includes(clusterFlag)) flags.push(clusterFlag);
  }

  return {
    tradeKey: raw.trade_key,
    ticker: raw.ticker,
    personName: raw.person_name,
    side,
    valueUsd: raw.value_usd ?? null,
    tradeDate: raw.trade_date,
    flags,
    mlReasons: normalizeMlReasons(raw.ml_reasons),
    mlAnomaly: Boolean(raw.ml_anomaly),
    mlScore: Number(raw.ml_score) || 0,
    signalScore: Number(raw.signal_score) || 0,
    return5dPct: raw.return_5d_pct ?? null,
    return30dPct: raw.return_30d_pct ?? null,
    clusterId: raw.cluster_id ?? null,
    clusterSize: Number(raw.cluster_size) || 0,
    isExecutive: Boolean(raw.is_executive) || raw.flags?.includes('executive'),
    feed: source === 'capitoltrades' ? 'politician' : 'corporate',
  };
}
