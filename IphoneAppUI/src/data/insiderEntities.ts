import type { Locale } from "@/i18n/types";
import { genSpike, type AISummaryData, type TradeSide } from "./mockData";

export type InsiderEntityType = "person" | "company";

export interface InsiderCompanyCluster {
  id: string;
  ticker: string;
  companyName: string;
  logoColor: string;
  insiders: number;
  trades: number;
  side: "buy" | "sell";
  spike: number[];
}

export interface InsiderHighlight {
  id: string;
  entityType: InsiderEntityType;
  name: string;
  subtitle: string;
  ticker: string;
  amount: number;
  shares: number;
  side: "buy" | "sell";
  spike: number[];
}

export interface InsiderTradeRecord {
  id: string;
  ticker: string;
  side: TradeSide;
  amount: number;
  shares: number;
  filedAt: string;
  tradeDate: string;
}

export interface InsiderActivityStats {
  totalBuys: number;
  buyTxCount: number;
  totalSells: number;
  sellTxCount: number;
  totalOptions: number;
  optionTxCount: number;
  plan10b5TxCount?: number;
  plan10b5Pct?: number;
  avgBuy: number;
  avgSell: number;
}

export interface InsiderCompanyActivity extends InsiderActivityStats {
  plan10b5TxCount: number;
  plan10b5Pct: number;
  buyRangeMin: number | null;
  buyRangeMax: number | null;
  sellRangeMin: number | null;
  sellRangeMax: number | null;
}

export interface InsiderCompanyTrade extends InsiderTradeRecord {
  insiderName: string;
  personId?: string;
}

export interface CompanyInsiderRow {
  id: string;
  name: string;
  role: string;
  tradesCount: number;
}

export interface TradeTypeBreakdown {
  buy: number;
  sell: number;
  option: number;
  plan10b5: number;
}

export interface InsiderCompanyProfile extends InsiderEntityProfile {
  entityType: "company";
  displayName: string;
  exchange: string;
  industry: string;
  description: string;
  dataAsOf: string;
  period?: string;
  activity: InsiderCompanyActivity;
  companyTrades: InsiderCompanyTrade[];
  insiders: CompanyInsiderRow[];
  tradeTypes: TradeTypeBreakdown;
  aiSummary: AISummaryData;
}

export interface InsiderEventStudy {
  id: string;
  ticker: string;
  title: string;
  personName: string;
}

export interface PoliticianTopIssuer {
  issuerId: string;
  name: string;
  ticker: string | null;
  count: number;
}

export interface PoliticianChartPoint {
  period: string;
  buyVolume: number;
  sellVolume: number;
  sp500Close: number | null;
}

export interface PoliticianProfileStats {
  totalTrades: number;
  issuerCount: number;
  totalVolume: number;
  maxTrade: number;
  lastTraded: string | null;
}

export interface PoliticianProfileCharts {
  stats: PoliticianProfileStats;
  topIssuers: PoliticianTopIssuer[];
  chartPoints: PoliticianChartPoint[];
}

export interface InsiderEntityProfile {
  id: string;
  entityType: InsiderEntityType;
  name: string;
  ticker: string;
  companyName: string;
  roles: string[];
  imageUrl?: string;
  logoLabel: string;
  logoColor: string;
  recentTrades: InsiderTradeRecord[];
  allTradesCount: number;
  activity: InsiderActivityStats;
  eventStudies: InsiderEventStudy[];
  party?: "R" | "D" | "I";
  state?: string;
  chamber?: string;
  politicianCharts?: PoliticianProfileCharts;
}

export interface InsiderDashboardExtras {
  companyClustersBuy: InsiderCompanyCluster[];
  companyClustersSell: InsiderCompanyCluster[];
  highlightsBuy: InsiderHighlight[];
  highlightsSell: InsiderHighlight[];
}

const PROFILES: Record<string, Omit<InsiderEntityProfile, "id">> = {
  "person-meister": {
    entityType: "person",
    name: "Meister Keith A.",
    ticker: "WGS",
    companyName: "GeneDx Holdings",
    roles: ["Director", "10% Owner"],
    logoLabel: "GD",
    logoColor: "#6366F1",
    allTradesCount: 12,
    activity: {
      totalBuys: 60_600_000,
      buyTxCount: 6,
      totalSells: 0,
      sellTxCount: 0,
      totalOptions: 0,
      optionTxCount: 0,
      avgBuy: 38.92,
      avgSell: 0,
    },
    eventStudies: [
      {
        id: "es-wgs-buy",
        ticker: "WGS",
        title: "WGS - Event Study Buy",
        personName: "Meister Keith A.",
      },
    ],
    recentTrades: [
      {
        id: "t1",
        ticker: "WGS",
        side: "buy",
        amount: 6_400_000,
        shares: 165_000,
        filedAt: "9h ago",
        tradeDate: "May 16, 2026",
      },
      {
        id: "t2",
        ticker: "WGS",
        side: "buy",
        amount: 12_100_000,
        shares: 310_000,
        filedAt: "May 14",
        tradeDate: "May 14, 2026",
      },
    ],
  },
  "person-pena": {
    entityType: "person",
    name: "Pena Michael",
    ticker: "PSQH",
    companyName: "PSQ Holdings",
    roles: ["Chief Financial Officer"],
    logoLabel: "PS",
    logoColor: "#0EA5E9",
    allTradesCount: 8,
    activity: {
      totalBuys: 420_000,
      buyTxCount: 2,
      totalSells: 1_900,
      sellTxCount: 1,
      totalOptions: 0,
      optionTxCount: 0,
      avgBuy: 0.61,
      avgSell: 0.61,
    },
    eventStudies: [],
    recentTrades: [
      {
        id: "t3",
        ticker: "PSQH",
        side: "sell",
        amount: 1_900,
        shares: 3100,
        filedAt: "2h ago",
        tradeDate: "May 15, 2026",
      },
    ],
  },
  "company-spt": {
    entityType: "company",
    name: "SPT Holding Sarl",
    ticker: "FLNC",
    companyName: "Fluence Energy",
    roles: ["10% Owner"],
    logoLabel: "SP",
    logoColor: "#F97316",
    allTradesCount: 24,
    activity: {
      totalBuys: 0,
      buyTxCount: 0,
      totalSells: 206_600_000,
      sellTxCount: 3,
      totalOptions: 0,
      optionTxCount: 0,
      avgBuy: 0,
      avgSell: 20.45,
    },
    eventStudies: [],
    recentTrades: [
      {
        id: "t4",
        ticker: "FLNC",
        side: "sell",
        amount: 206_600_000,
        shares: 10_100_000,
        filedAt: "May 15",
        tradeDate: "May 15, 2026",
      },
    ],
  },
  "company-hdsn": {
    entityType: "company",
    name: "Hudson Technologies",
    ticker: "HDSN",
    companyName: "Hudson Technologies Inc",
    roles: ["Issuer"],
    logoLabel: "HD",
    logoColor: "#166534",
    allTradesCount: 15,
    activity: {
      totalBuys: 151_410,
      buyTxCount: 7,
      totalSells: 0,
      sellTxCount: 0,
      totalOptions: 0,
      optionTxCount: 0,
      avgBuy: 4.91,
      avgSell: 0,
    },
    eventStudies: [],
    recentTrades: [
      {
        id: "t5",
        ticker: "HDSN",
        side: "buy",
        amount: 12_400,
        shares: 2500,
        filedAt: "15h ago",
        tradeDate: "May 16, 2026",
      },
    ],
  },
  "person-mansy": {
    entityType: "person",
    name: "Mansy Loan Nguyen",
    ticker: "HDSN",
    companyName: "Hudson Technologies Inc",
    roles: ["Officer"],
    logoLabel: "MN",
    logoColor: "#166534",
    allTradesCount: 9,
    activity: {
      totalBuys: 98_400,
      buyTxCount: 9,
      totalSells: 0,
      sellTxCount: 0,
      totalOptions: 0,
      optionTxCount: 0,
      avgBuy: 4.89,
      avgSell: 0,
    },
    eventStudies: [],
    recentTrades: [
      {
        id: "t-m1",
        ticker: "HDSN",
        side: "buy",
        amount: 12_400,
        shares: 2500,
        filedAt: "15h ago",
        tradeDate: "May 16, 2026",
      },
    ],
  },
  "person-schwartz": {
    entityType: "person",
    name: "Schwartz Robert L.",
    ticker: "HDSN",
    companyName: "Hudson Technologies Inc",
    roles: ["Director"],
    logoLabel: "SR",
    logoColor: "#166534",
    allTradesCount: 4,
    activity: {
      totalBuys: 42_000,
      buyTxCount: 4,
      totalSells: 0,
      sellTxCount: 0,
      totalOptions: 0,
      optionTxCount: 0,
      avgBuy: 4.92,
      avgSell: 0,
    },
    eventStudies: [],
    recentTrades: [
      {
        id: "t-s1",
        ticker: "HDSN",
        side: "buy",
        amount: 22_100,
        shares: 4500,
        filedAt: "May 14",
        tradeDate: "May 14, 2026",
      },
    ],
  },
  "person-wunderlich": {
    entityType: "person",
    name: "Wunderlich Dusty",
    ticker: "WRBY",
    companyName: "Warby Parker",
    roles: ["Chief Strategy Officer"],
    logoLabel: "WD",
    logoColor: "#EC4899",
    allTradesCount: 5,
    activity: {
      totalBuys: 0,
      buyTxCount: 0,
      totalSells: 575_000,
      sellTxCount: 2,
      totalOptions: 0,
      optionTxCount: 0,
      avgBuy: 0,
      avgSell: 6.55,
    },
    eventStudies: [],
    recentTrades: [
      {
        id: "t7",
        ticker: "WRBY",
        side: "sell",
        amount: 575_000,
        shares: 88_000,
        filedAt: "May 15",
        tradeDate: "May 15, 2026",
      },
    ],
  },
  "company-wgs": {
    entityType: "company",
    name: "GeneDx Holdings",
    ticker: "WGS",
    companyName: "GeneDx Holdings Corp",
    roles: ["Issuer"],
    logoLabel: "GD",
    logoColor: "#6366F1",
    allTradesCount: 12,
    activity: {
      totalBuys: 60_600_000,
      buyTxCount: 6,
      totalSells: 0,
      sellTxCount: 0,
      totalOptions: 0,
      optionTxCount: 0,
      avgBuy: 38.92,
      avgSell: 0,
    },
    eventStudies: [
      {
        id: "es-wgs-buy",
        ticker: "WGS",
        title: "WGS - Event Study Buy",
        personName: "Meister Keith A.",
      },
    ],
    recentTrades: [
      {
        id: "t6",
        ticker: "WGS",
        side: "buy",
        amount: 6_400_000,
        shares: 165_000,
        filedAt: "9h ago",
        tradeDate: "May 16, 2026",
      },
    ],
  },
};

export function buildInsiderDashboardExtras(_locale: Locale): InsiderDashboardExtras {
  return {
    companyClustersBuy: [
      {
        id: "cc-hdsn",
        ticker: "HDSN",
        companyName: "HUDSON TECHN...",
        logoColor: "#166534",
        insiders: 7,
        trades: 7,
        side: "buy",
        spike: genSpike(80, 14, "up"),
      },
      {
        id: "cc-oln",
        ticker: "OLN",
        companyName: "OLIN CORP",
        logoColor: "#1D4ED8",
        insiders: 5,
        trades: 6,
        side: "buy",
        spike: genSpike(81, 14, "up"),
      },
    ],
    companyClustersSell: [
      {
        id: "cc-z",
        ticker: "Z",
        companyName: "ZILLOW GROUP",
        logoColor: "#1E3A5F",
        insiders: 6,
        trades: 7,
        side: "sell",
        spike: genSpike(90, 14, "down"),
      },
      {
        id: "cc-kpti",
        ticker: "KPTI",
        companyName: "KARYOPHARM",
        logoColor: "#7C3AED",
        insiders: 4,
        trades: 5,
        side: "sell",
        spike: genSpike(91, 14, "down"),
      },
    ],
    highlightsBuy: [
      {
        id: "person-meister",
        entityType: "person",
        name: "Meister Keith A.",
        subtitle: "Director • WGS",
        ticker: "WGS",
        amount: 6_400_000,
        shares: 165_000,
        side: "buy",
        spike: genSpike(100, 12, "up"),
      },
      {
        id: "person-pena",
        entityType: "person",
        name: "Pena Michael",
        subtitle: "Chief Financial Officer • PSQH",
        ticker: "PSQH",
        amount: 420_000,
        shares: 680_000,
        side: "buy",
        spike: genSpike(101, 12, "up"),
      },
    ],
    highlightsSell: [
      {
        id: "company-spt",
        entityType: "company",
        name: "SPT Holding Sarl",
        subtitle: "10% Owner • FLNC",
        ticker: "FLNC",
        amount: 206_600_000,
        shares: 10_100_000,
        side: "sell",
        spike: genSpike(110, 12, "down"),
      },
      {
        id: "person-wunderlich",
        entityType: "person",
        name: "Wunderlich Dusty",
        subtitle: "Chief Strategy Officer • WRBY",
        ticker: "WRBY",
        amount: 575_000,
        shares: 88_000,
        side: "sell",
        spike: genSpike(111, 12, "down"),
      },
    ],
  };
}

type CompanyProfileExtras = Omit<
  InsiderCompanyProfile,
  keyof InsiderEntityProfile | "id" | "entityType" | "activity"
> & {
  activity: InsiderCompanyActivity;
};

const COMPANY_EXTRAS: Record<string, CompanyProfileExtras> = {
  "company-hdsn": {
    displayName: "HUDSON TECHNOLOGIES INC / NY",
    exchange: "NYSE",
    industry: "Specialty Chemicals",
    description:
      "Hudson Technologies, Inc. is a leading provider of innovative and sustainable refrigerant products and services to the heating, ventilation, air conditioning, and refrigeration industries. The company delivers comprehensive solutions including reclamation, recycling, and distribution of refrigerants.",
    dataAsOf: "May 15",
    activity: {
      totalBuys: 151_410,
      buyTxCount: 7,
      totalSells: 0,
      sellTxCount: 0,
      totalOptions: 0,
      optionTxCount: 0,
      avgBuy: 4.91,
      avgSell: 0,
      plan10b5TxCount: 0,
      plan10b5Pct: 0,
      buyRangeMin: 4.84,
      buyRangeMax: 4.96,
      sellRangeMin: null,
      sellRangeMax: null,
    },
    companyTrades: [
      {
        id: "ct1",
        ticker: "HDSN",
        insiderName: "Mansy Loan Nguyen",
        personId: "person-mansy",
        side: "buy",
        amount: 12_400,
        shares: 2500,
        filedAt: "15h ago",
        tradeDate: "May 16, 2026",
      },
      {
        id: "ct2",
        ticker: "HDSN",
        insiderName: "Mansy Loan Nguyen",
        personId: "person-mansy",
        side: "buy",
        amount: 18_200,
        shares: 3700,
        filedAt: "May 15",
        tradeDate: "May 15, 2026",
      },
      {
        id: "ct3",
        ticker: "HDSN",
        insiderName: "Schwartz Robert L.",
        personId: "person-schwartz",
        side: "buy",
        amount: 22_100,
        shares: 4500,
        filedAt: "May 14",
        tradeDate: "May 14, 2026",
      },
    ],
    insiders: [
      { id: "person-mansy", name: "Mansy Loan Nguyen", role: "Officer", tradesCount: 9 },
      { id: "person-schwartz", name: "Schwartz Robert L.", role: "Director", tradesCount: 4 },
      { id: "person-holmes", name: "Holmes Brian", role: "CEO", tradesCount: 2 },
    ],
    tradeTypes: { buy: 100, sell: 0, option: 0, plan10b5: 0 },
    aiSummary: {
      headline: "7 insider buys cluster at $4.84–$4.96 with no sells in the last 30 days.",
      bullets: [
        "Mansy Loan Nguyen led activity with 9 open-market purchases.",
        "All transactions were discretionary buys; no 10b5-1 plan filings.",
        "Specialty chemicals peer group shows net insider buying this week.",
      ],
      sentiment: "bullish",
    },
  },
  "company-spt": {
    displayName: "FLUENCE ENERGY INC / DE",
    exchange: "NASDAQ",
    industry: "Renewable Energy",
    description:
      "Fluence Energy, Inc. provides energy storage products and services, and digital applications for renewables and storage assets worldwide.",
    dataAsOf: "May 15",
    activity: {
      totalBuys: 0,
      buyTxCount: 0,
      totalSells: 206_600_000,
      sellTxCount: 3,
      totalOptions: 0,
      optionTxCount: 0,
      avgBuy: 0,
      avgSell: 20.45,
      plan10b5TxCount: 0,
      plan10b5Pct: 0,
      buyRangeMin: null,
      buyRangeMax: null,
      sellRangeMin: 19.8,
      sellRangeMax: 21.1,
    },
    companyTrades: [
      {
        id: "ct4",
        ticker: "FLNC",
        insiderName: "SPT Holding Sarl",
        side: "sell",
        amount: 206_600_000,
        shares: 10_100_000,
        filedAt: "May 15",
        tradeDate: "May 15, 2026",
      },
    ],
    insiders: [
      { id: "company-spt", name: "SPT Holding Sarl", role: "10% Owner", tradesCount: 3 },
    ],
    tradeTypes: { buy: 0, sell: 100, option: 0, plan10b5: 0 },
    aiSummary: {
      headline: "Major block sale by 10% owner SPT Holding Sarl.",
      bullets: [
        "Single holder reduced position by 10.1M shares.",
        "No offsetting insider buys in the same period.",
      ],
      sentiment: "bearish",
    },
  },
  "company-wgs": {
    displayName: "GENEDX HOLDINGS CORP / DE",
    exchange: "NASDAQ",
    industry: "Biotechnology",
    description:
      "GeneDx Holdings Corp. provides genetic testing services, delivering actionable insights for clinical decision-making.",
    dataAsOf: "May 15",
    activity: {
      totalBuys: 60_600_000,
      buyTxCount: 6,
      totalSells: 0,
      sellTxCount: 0,
      totalOptions: 0,
      optionTxCount: 0,
      avgBuy: 38.92,
      avgSell: 0,
      plan10b5TxCount: 0,
      plan10b5Pct: 0,
      buyRangeMin: 37.86,
      buyRangeMax: 40.59,
      sellRangeMin: null,
      sellRangeMax: null,
    },
    companyTrades: [
      {
        id: "ct5",
        ticker: "WGS",
        insiderName: "Meister Keith A.",
        personId: "person-meister",
        side: "buy",
        amount: 6_400_000,
        shares: 165_000,
        filedAt: "9h ago",
        tradeDate: "May 16, 2026",
      },
    ],
    insiders: [
      { id: "person-meister", name: "Meister Keith A.", role: "Director", tradesCount: 12 },
    ],
    tradeTypes: { buy: 100, sell: 0, option: 0, plan10b5: 0 },
    aiSummary: {
      headline: "Director Meister Keith A. led $60.6M in open-market buys.",
      bullets: [
        "Event study flagged WGS as top cluster buy.",
        "No insider sales reported in the last 30 days.",
      ],
      sentiment: "bullish",
    },
  },
};

function buildDefaultCompanyExtras(
  base: Omit<InsiderEntityProfile, "id">
): CompanyProfileExtras {
  const trades: InsiderCompanyTrade[] = base.recentTrades.map((t) => ({
    ...t,
    insiderName: base.name,
  }));
  const buyPct =
    base.activity.buyTxCount + base.activity.sellTxCount > 0
      ? Math.round(
          (base.activity.buyTxCount /
            (base.activity.buyTxCount + base.activity.sellTxCount)) *
            100
        )
      : 100;
  return {
    displayName: `${base.companyName.toUpperCase()}`,
    exchange: "NYSE",
    industry: "—",
    description: base.companyName,
    dataAsOf: "May 15",
    activity: {
      ...base.activity,
      plan10b5TxCount: 0,
      plan10b5Pct: 0,
      buyRangeMin: base.activity.avgBuy > 0 ? base.activity.avgBuy * 0.98 : null,
      buyRangeMax: base.activity.avgBuy > 0 ? base.activity.avgBuy * 1.02 : null,
      sellRangeMin: base.activity.avgSell > 0 ? base.activity.avgSell * 0.98 : null,
      sellRangeMax: base.activity.avgSell > 0 ? base.activity.avgSell * 1.02 : null,
    },
    companyTrades: trades,
    insiders: [],
    tradeTypes: {
      buy: buyPct,
      sell: 100 - buyPct,
      option: 0,
      plan10b5: 0,
    },
    aiSummary: {
      headline: `${base.ticker} insider activity summary.`,
      bullets: [`${base.allTradesCount} filings in the selected period.`],
      sentiment: "mixed",
    },
  };
}

/** Dashboard card ids → curated mock profile keys */
const PERSON_PROFILE_ALIASES: Record<string, string> = {
  ib1: "person-pena",
  ib2: "person-pena",
  ib3: "person-wunderlich",
  is1: "person-mansy",
  is2: "person-wunderlich",
};

const COMPANY_PROFILE_ALIASES: Record<string, string> = {
  "cc-hdsn": "company-hdsn",
  "cc-oln": "company-hdsn",
  "cc-z": "company-hdsn",
  "cc-kpti": "company-spt",
};

export function resolveMockPersonProfileKey(id: string): string | null {
  if (PROFILES[id] && PROFILES[id].entityType === "person") return id;
  const aliased = PERSON_PROFILE_ALIASES[id];
  if (aliased && PROFILES[aliased]?.entityType === "person") return aliased;
  return null;
}

export function resolveMockCompanyProfileKey(id: string): string | null {
  if (PROFILES[id]?.entityType === "company") return id;
  const aliased = COMPANY_PROFILE_ALIASES[id];
  if (aliased && PROFILES[aliased]?.entityType === "company") return aliased;
  return null;
}

export function hasMockPersonProfile(id: string): boolean {
  return resolveMockPersonProfileKey(id) !== null;
}

export function hasMockCompanyProfile(id: string): boolean {
  return resolveMockCompanyProfileKey(id) !== null;
}

export function getInsiderEntityProfile(id: string): InsiderEntityProfile | null {
  const key = resolveMockPersonProfileKey(id);
  if (!key) return null;
  const base = PROFILES[key];
  return { id, ...base };
}

export function getInsiderCompanyProfile(id: string): InsiderCompanyProfile | null {
  const key = resolveMockCompanyProfileKey(id);
  if (!key) return null;
  const base = PROFILES[key];
  if (base.entityType !== "company") return null;
  const extras = COMPANY_EXTRAS[key] ?? buildDefaultCompanyExtras(base);
  return { id, ...base, entityType: "company", ...extras };
}

export function entityProfilePath(profile: Pick<InsiderEntityProfile, "id" | "entityType">) {
  return profile.entityType === "person"
    ? `/insider/person/${profile.id}`
    : `/insider/company/${profile.id}`;
}

export function tickerFromCompanyRouteId(id: string): string | null {
  const match = id.match(/^company-(.+)$/i);
  return match ? match[1].toUpperCase() : null;
}

export function companyPathFromTicker(ticker: string) {
  return `/insider/company/company-${ticker.toLowerCase()}`;
}

export function personPathFromOwnerId(ownerId: string) {
  return ownerId.startsWith('person-')
    ? `/insider/person/${ownerId}`
    : `/insider/person/person-${ownerId}`;
}

export function clusterCompanyPath(cluster: InsiderCompanyCluster) {
  return companyPathFromTicker(cluster.ticker);
}

export function highlightProfilePath(item: InsiderHighlight) {
  if (item.entityType === 'person') {
    return personPathFromOwnerId(item.id);
  }
  return companyPathFromTicker(item.ticker);
}

export function formatInsiderShares(shares: number, zeroLabel?: string): string {
  if (!shares || shares <= 0) return zeroLabel ?? "0 shares";
  if (shares >= 1_000_000) return `${(shares / 1_000_000).toFixed(1)}M shares`;
  if (shares >= 1_000) return `${(shares / 1_000).toFixed(1)}K shares`;
  return `${shares.toLocaleString()} shares`;
}

export function formatInsiderMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toLocaleString()}`;
}
