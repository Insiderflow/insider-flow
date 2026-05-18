import type { DataMode } from "@/context/DataModeContext";
import { getMessages } from "@/i18n/messages";
import type { Locale } from "@/i18n/types";
import type { TradeFlagCode } from "@/types/tradeFlags";
import type { InsiderDashboardExtras } from "./insiderEntities";
import { hydrateTodaysTrades } from "./hydrateTodaysTrades";
import { etCalendarYmd } from "@/lib/etDate";
import { enrichIndustryChain } from "@/lib/industryChainModel";

export type Period = "1D" | "7D" | "30D" | "90D";
export type IndustrySegmentTone = "buy" | "sell" | "mixed" | "neutral";

export interface IndustryChainSegment {
  name: string;
  nameKey: string;
  tone: IndustrySegmentTone;
  /** Buy share for conic-gradient (mixed only). */
  buyPct?: number;
  /** Present when API aggregates real sub-sector flow. */
  buyAmount?: number;
  sellAmount?: number;
}

export interface IndustryChainNode {
  name: string;
  nameKey: string;
  buyPct: number;
  sellPct: number;
  netAmount: number;
  buyAmount?: number;
  sellAmount?: number;
  segments?: IndustryChainSegment[];
}
export type TradeSide = "buy" | "sell" | "proposed_sale";
export type Party = "R" | "D" | "I";

export interface DashboardMeta {
  dataAsOf: string;
  nextUpdateEt: string;
  /** When this dashboard payload was built (ISO). */
  generatedAt?: string;
  /** Latest Capitol disclosure publish time in DB (ISO). */
  latestDisclosureAt?: string;
}

/** Server stats used to rebuild localized AI copy on the client. */
export interface DashboardAiSummaryStats {
  buysCount: number;
  sellsCount: number;
  buysToday: number;
  period: Period;
  topSectorKey: string | null;
}

export interface AISummaryData {
  headline: string;
  /** Prose daily brief (preferred over bullets). */
  narrative?: string;
  bullets: string[];
  sentiment: "bullish" | "bearish" | "mixed";
  stats?: DashboardAiSummaryStats;
}

export interface KpiItem {
  id: string;
  label: string;
  value: number;
  changePct: number;
  spike: number[];
}

export interface ClusterItem {
  id: string;
  issuerId?: string;
  title: string;
  subtitle: string;
  insiders: number;
  trades: number;
  totalAmount: number;
  party: Party;
  tickers: string[];
  spike: number[];
  side: "buy" | "sell";
}

export interface PoliticianTradeHighlight {
  id: string;
  politicianId?: string;
  name: string;
  title: string;
  /** GICS seat sector from API, or legacy rep/sen in static mocks */
  titleKey: string;
  party: Party;
  state: string;
  ticker: string;
  issuer: string;
  amount: number;
  shares: number;
  tradeDate: string;
  /** Disclosure publish date (申報日); shown on politician overview cards. */
  filedAt?: string;
  side: TradeSide;
  imageUrl?: string;
  spike: number[];
  flags?: TradeFlagCode[];
}

export interface PrimeBrokerItem {
  id: string;
  name: string;
  flowAmount: number;
  direction: "inflow" | "outflow";
  industryCount: number;
  spike: number[];
}

export interface PrimeBrokerIndustryRow {
  nameKey: string;
  name: string;
  amount: number;
  tradeCount: number;
  pct: number;
}

export interface PrimeBrokerDetail {
  id: string;
  name: string;
  flowAmount: number;
  industryCount: number;
  industries: PrimeBrokerIndustryRow[];
}

export interface IndustryBarItem {
  name: string;
  nameKey: string;
  buyAmount: number;
  sellAmount: number;
  buyCount?: number;
  sellCount?: number;
}

export type IndustryCompareSide = "buy" | "sell";

export interface IndustryCompanyRow {
  ticker: string;
  companyName: string;
  amount: number;
  tradeCount: number;
  insiderCount: number;
}

export interface IndustryDetailPayload {
  sector: string;
  side: IndustryCompareSide;
  sectors: IndustryBarItem[];
  companies: IndustryCompanyRow[];
}

export interface RecentTrade {
  id: string;
  politicianId?: string;
  politician: string;
  party: Party;
  ticker: string;
  side: TradeSide;
  amount: number;
  flags?: TradeFlagCode[];
  filedAt: string;
  filedAtKey: string;
}

export interface DashboardPayload {
  meta: DashboardMeta;
  aiSummary: AISummaryData;
  kpis: KpiItem[];
  clusterBuys: ClusterItem[];
  clusterSells: ClusterItem[];
  topPoliticianBuys: PoliticianTradeHighlight[];
  topPoliticianSells: PoliticianTradeHighlight[];
  /** Politician trades on the current US Eastern calendar day. */
  todaysTrades?: PoliticianTradeHighlight[];
  primeBrokers: PrimeBrokerItem[];
  industryChain: IndustryChainNode[];
  topIndustries: IndustryBarItem[];
  recentTrades: RecentTrade[];
  insiderExtras?: InsiderDashboardExtras;
}

export function genSpike(seed: number, len = 12, bias: "up" | "down" | "mixed" = "up"): number[] {
  const arr: number[] = [];
  let v = 0.3 + (seed % 7) * 0.05;
  for (let i = 0; i < len; i++) {
    const noise = Math.sin(seed * 12.9898 + i * 78.233) * 0.5 + 0.5;
    const drift =
      bias === "up" ? 0.04 : bias === "down" ? -0.04 : (i % 2 === 0 ? 0.03 : -0.03);
    v = Math.max(0.08, Math.min(1, v + drift * noise));
    arr.push(Number(v.toFixed(3)));
  }
  return arr;
}

export const BASE = {
  clusterBuys: [
    {
      id: "cb1",
      insiders: 9,
      trades: 23,
      totalAmount: 2_840_000,
      party: "D" as Party,
      tickers: ["NVDA", "AMD", "AVGO"],
      spike: genSpike(10, 16, "up"),
      side: "buy" as const,
    },
    {
      id: "cb2",
      insiders: 7,
      trades: 18,
      totalAmount: 1_920_000,
      party: "D" as Party,
      tickers: ["MSFT", "GOOGL", "META"],
      spike: genSpike(11, 16, "up"),
      side: "buy" as const,
    },
    {
      id: "cb3",
      insiders: 5,
      trades: 11,
      totalAmount: 980_000,
      party: "R" as Party,
      tickers: ["LMT", "RTX", "NOC"],
      spike: genSpike(12, 16, "up"),
      side: "buy" as const,
    },
  ],
  clusterSells: [
    {
      id: "cs1",
      insiders: 11,
      trades: 27,
      totalAmount: 3_100_000,
      party: "R" as Party,
      tickers: ["ZION", "CFG", "KEY"],
      spike: genSpike(20, 16, "down"),
      side: "sell" as const,
    },
    {
      id: "cs2",
      insiders: 6,
      trades: 14,
      totalAmount: 1_450_000,
      party: "D" as Party,
      tickers: ["XOM", "CVX", "OXY"],
      spike: genSpike(21, 16, "down"),
      side: "sell" as const,
    },
  ],
  topPoliticianBuys: [
    {
      id: "pb1",
      name: "Ro Khanna",
      titleKey: "rep" as const,
      party: "D" as Party,
      state: "CA",
      ticker: "NVDA",
      issuer: "NVIDIA Corp",
      amount: 1_250_000,
      shares: 8200,
      tradeDate: "May 12",
      side: "buy" as TradeSide,
      spike: genSpike(30, 12, "up"),
    },
    {
      id: "pb2",
      name: "Dan Crenshaw",
      titleKey: "rep" as const,
      party: "R" as Party,
      state: "TX",
      ticker: "MSFT",
      issuer: "Microsoft Corp",
      amount: 890_000,
      shares: 2100,
      tradeDate: "May 11",
      side: "buy" as TradeSide,
      spike: genSpike(31, 12, "up"),
    },
    {
      id: "pb3",
      name: "Nancy Pelosi",
      titleKey: "rep" as const,
      party: "D" as Party,
      state: "CA",
      ticker: "AVGO",
      issuer: "Broadcom Inc",
      amount: 2_100_000,
      shares: 1500,
      tradeDate: "May 10",
      side: "buy" as TradeSide,
      spike: genSpike(32, 12, "up"),
    },
  ],
  topPoliticianSells: [
    {
      id: "ps1",
      name: "Josh Gottheimer",
      titleKey: "rep" as const,
      party: "D" as Party,
      state: "NJ",
      ticker: "ZION",
      issuer: "Zions Bancorp",
      amount: 620_000,
      shares: 12000,
      tradeDate: "May 13",
      side: "sell" as TradeSide,
      spike: genSpike(40, 12, "down"),
    },
    {
      id: "ps2",
      name: "Tommy Tuberville",
      titleKey: "sen" as const,
      party: "R" as Party,
      state: "AL",
      ticker: "XOM",
      issuer: "Exxon Mobil",
      amount: 480_000,
      shares: 4500,
      tradeDate: "May 12",
      side: "proposed_sale" as TradeSide,
      spike: genSpike(41, 12, "down"),
    },
    {
      id: "ps3",
      name: "Markwayne Mullin",
      titleKey: "sen" as const,
      party: "R" as Party,
      state: "OK",
      ticker: "META",
      issuer: "Meta Platforms",
      amount: 350_000,
      shares: 600,
      tradeDate: "May 11",
      side: "sell" as TradeSide,
      spike: genSpike(42, 12, "down"),
    },
  ],
  primeBrokers: [
    {
      id: "goldman-sachs",
      name: "Goldman Sachs",
      flowAmount: 206_000_000,
      direction: "inflow" as const,
      industryCount: 13,
      spike: genSpike(50, 10, "up"),
    },
    {
      id: "ubs",
      name: "UBS",
      flowAmount: 106_100_000,
      direction: "inflow" as const,
      industryCount: 17,
      spike: genSpike(51, 10, "up"),
    },
    {
      id: "j-p-morgan",
      name: "J.P. Morgan",
      flowAmount: 82_200_000,
      direction: "inflow" as const,
      industryCount: 21,
      spike: genSpike(52, 10, "mixed"),
    },
    {
      id: "morgan-stanley",
      name: "Morgan Stanley",
      flowAmount: 142_300_000,
      direction: "inflow" as const,
      industryCount: 29,
      spike: genSpike(53, 10, "up"),
    },
  ],
  industryChain: [
    {
      nameKey: "InformationTechnology",
      name: "InformationTechnology",
      buyPct: 8,
      sellPct: 92,
      netAmount: -84_000_000,
      buyAmount: 8_200_000,
      sellAmount: 92_200_000,
    },
    {
      nameKey: "Energy",
      name: "Energy",
      buyPct: 8,
      sellPct: 92,
      netAmount: -48_100_000,
      buyAmount: 4_700_000,
      sellAmount: 52_800_000,
    },
    {
      nameKey: "Healthcare",
      name: "Healthcare",
      buyPct: 62,
      sellPct: 38,
      netAmount: 2_500_000,
      buyAmount: 6_600_000,
      sellAmount: 4_100_000,
    },
    {
      nameKey: "Financials",
      name: "Financials",
      buyPct: 35,
      sellPct: 65,
      netAmount: -2_700_000,
      buyAmount: 3_200_000,
      sellAmount: 5_900_000,
    },
    {
      nameKey: "N/A",
      name: "N/A",
      buyPct: 25,
      sellPct: 75,
      netAmount: -2_900_000,
      buyAmount: 1_400_000,
      sellAmount: 4_300_000,
    },
    {
      nameKey: "Other",
      name: "Other",
      buyPct: 38,
      sellPct: 62,
      netAmount: -162_000,
      buyAmount: 255_000,
      sellAmount: 417_000,
    },
  ] as IndustryChainNode[],
  topIndustries: [
    { nameKey: "InformationTechnology", buyAmount: 12_400_000, sellAmount: 8_200_000 },
    { nameKey: "Energy", buyAmount: 4_700_000, sellAmount: 52_800_000 },
    { nameKey: "Healthcare", buyAmount: 6_600_000, sellAmount: 4_100_000 },
    { nameKey: "Financials", buyAmount: 3_200_000, sellAmount: 5_900_000 },
    { nameKey: "Industrials", buyAmount: 2_800_000, sellAmount: 3_400_000 },
  ],
  recentTrades: [
    { id: "rt1", politician: "Ro Khanna", party: "D" as Party, ticker: "NVDA", side: "buy" as TradeSide, amount: 250_000, filedAtKey: "2h ago" },
    { id: "rt2", politician: "Tommy Tuberville", party: "R" as Party, ticker: "XOM", side: "proposed_sale" as TradeSide, amount: 180_000, filedAtKey: "3h ago" },
    { id: "rt3", politician: "Josh Gottheimer", party: "D" as Party, ticker: "ZION", side: "sell" as TradeSide, amount: 95_000, filedAtKey: "4h ago" },
    { id: "rt4", politician: "Dan Crenshaw", party: "R" as Party, ticker: "MSFT", side: "buy" as TradeSide, amount: 420_000, filedAtKey: "5h ago" },
    { id: "rt5", politician: "Nancy Pelosi", party: "D" as Party, ticker: "AVGO", side: "buy" as TradeSide, amount: 1_100_000, filedAtKey: "6h ago" },
    { id: "rt6", politician: "Markwayne Mullin", party: "R" as Party, ticker: "META", side: "sell" as TradeSide, amount: 75_000, filedAtKey: "7h ago" },
    { id: "rt7", politician: "Sheldon Whitehouse", party: "D" as Party, ticker: "NEE", side: "buy" as TradeSide, amount: 55_000, filedAtKey: "8h ago" },
    { id: "rt8", politician: "Rick Scott", party: "R" as Party, ticker: "JPM", side: "sell" as TradeSide, amount: 210_000, filedAtKey: "9h ago" },
  ],
};

/** GICS sector keys from API (e.g. CommunicationServices) → display label key. */
function gicsSectorLookupKey(key: string): string {
  return key.replace(/([a-z])([A-Z])/g, "$1 $2");
}

export function industryName(locale: Locale, key: string): string {
  const m = getMessages(locale);
  const fromIndustries = m.mock.industries[key];
  if (fromIndustries) return fromIndustries;
  const spaced = gicsSectorLookupKey(key);
  if (spaced in m.sectors) {
    return m.sectors[spaced as keyof typeof m.sectors];
  }
  if (key in m.sectors) {
    return m.sectors[key as keyof typeof m.sectors];
  }
  return key;
}

function roleTitle(m: ReturnType<typeof getMessages>, key: string, fallback: string): string {
  if (key === "sen") return m.trade.sen;
  if (key === "rep") return m.trade.rep;
  if (key in m.sectors) return m.sectors[key as keyof typeof m.sectors];
  return fallback;
}

export function buildPoliticianDashboard(locale: Locale): DashboardPayload {
  const m = getMessages(locale);

  const payload: DashboardPayload = {
    meta: { ...m.mock.meta },
    aiSummary: {
      headline: m.mock.aiSummary.headline,
      narrative: m.mock.aiSummary.narrative,
      bullets: [],
      sentiment: "mixed",
    },
    kpis: [
      { id: "buys", label: m.kpi.buys, value: 847, changePct: 12.4, spike: genSpike(1, 14, "up") },
      { id: "sells", label: m.kpi.sells, value: 612, changePct: -3.2, spike: genSpike(2, 14, "down") },
      { id: "options", label: m.kpi.options, value: 94, changePct: 8.1, spike: genSpike(3, 14, "mixed") },
      { id: "pp_sale", label: m.kpi.ppSale, value: 41, changePct: 5.6, spike: genSpike(4, 14, "up") },
    ],
    clusterBuys: BASE.clusterBuys.map((c) => {
      const text = m.mock.clusters[c.id]!;
      return { ...c, title: text.title, subtitle: text.subtitle };
    }),
    clusterSells: BASE.clusterSells.map((c) => {
      const text = m.mock.clusters[c.id]!;
      return { ...c, title: text.title, subtitle: text.subtitle };
    }),
    topPoliticianBuys: BASE.topPoliticianBuys.map((p) => ({
      ...p,
      title: roleTitle(m, p.titleKey, p.titleKey),
      filedAt: p.tradeDate,
    })),
    topPoliticianSells: BASE.topPoliticianSells.map((p) => ({
      ...p,
      title: roleTitle(m, p.titleKey, p.titleKey),
      filedAt: p.tradeDate,
    })),
    todaysTrades: BASE.topPoliticianBuys.map((p, i) => ({
      ...p,
      id: `today-mock-${p.id}-${i}`,
      title: roleTitle(m, p.titleKey, p.titleKey),
      tradeDate: etCalendarYmd(),
      filedAt: etCalendarYmd(),
    })),
    primeBrokers: BASE.primeBrokers,
    industryChain: enrichIndustryChain(
      BASE.industryChain.map((n) => ({
        ...n,
        name: industryName(locale, n.nameKey),
        segments: n.segments?.map((s) => ({
          ...s,
          name: industryName(locale, s.nameKey),
        })),
      })),
    ),
    topIndustries: BASE.topIndustries.map((n) => ({
      ...n,
      name: industryName(locale, n.nameKey),
    })),
    recentTrades: BASE.recentTrades.map((t) => ({
      ...t,
      filedAt: m.mock.filedAt[t.filedAtKey] ?? t.filedAtKey,
    })),
  };

  return hydrateTodaysTrades(payload);
}

export async function fetchDashboard(
  period: Period,
  locale: Locale,
  dataMode: DataMode = "politician"
): Promise<DashboardPayload> {
  const { fetchDashboardFromApi } = await import("@/api/services/dashboard");
  return fetchDashboardFromApi(period, locale, dataMode);
}
