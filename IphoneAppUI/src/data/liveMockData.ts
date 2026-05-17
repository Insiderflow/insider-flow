import { localizePoliticianSeatTitle } from "@/lib/politicianSectorLabel";
import type { DataMode } from "@/context/DataModeContext";
import { getMessages } from "@/i18n/messages";
import type { Locale } from "@/i18n/types";
import type { Party, TradeSide } from "./mockData";

export type LiveFeedMode = "live" | "history";

export interface LiveTrade {
  id: string;
  ticker: string;
  displayName: string;
  title: string;
  showParty: boolean;
  party?: Party;
  side: TradeSide;
  disclosureBadge: string;
  metricLabel: "holdings" | "outstanding";
  metricValue: string;
  metricPositive?: boolean;
  filedDisplay: string;
  priceDisplay: string;
  totalValueDisplay: string;
  dateKey: string;
  profilePath?: string;
  politicianId?: string;
  imageUrl?: string;
}

export interface LiveDateChip {
  id: string;
  label: string;
}

type PoliticianRow = {
  id: string;
  ticker: string;
  name: string;
  titleKey: string;
  party: Party;
  side: TradeSide;
  metricLabel: "holdings" | "outstanding";
  metricValue: string;
  metricPositive?: boolean;
  filedKey: string;
  price: number;
  totalValue: number;
  dateKey: string;
};

type InsiderRow = {
  id: string;
  ticker: string;
  name: string;
  roleKey: "cfo" | "officer" | "director" | "ceo";
  side: TradeSide;
  badge: "rsu" | "stock";
  metricLabel: "holdings" | "outstanding";
  metricValue: string;
  metricPositive?: boolean;
  filedKey: string;
  price: number;
  totalValue: number;
  dateKey: string;
};

const POLITICIAN_TRADES: PoliticianRow[] = [
  {
    id: "lt1",
    ticker: "NVDA",
    name: "Ro Khanna",
    titleKey: "rep",
    party: "D",
    side: "buy",
    metricLabel: "holdings",
    metricValue: "+12.4%",
    metricPositive: true,
    filedKey: "may15-2148",
    price: 118.42,
    totalValue: 250_000,
    dateKey: "2026-05-15",
  },
  {
    id: "lt2",
    ticker: "PSQH",
    name: "Nancy Pelosi",
    titleKey: "rep",
    party: "D",
    side: "sell",
    metricLabel: "holdings",
    metricValue: "-13.8%",
    metricPositive: false,
    filedKey: "may15-2144",
    price: 0.61,
    totalValue: 1_900,
    dateKey: "2026-05-15",
  },
  {
    id: "lt3",
    ticker: "WRBY",
    name: "Tommy Tuberville",
    titleKey: "sen",
    party: "R",
    side: "proposed_sale",
    metricLabel: "holdings",
    metricValue: "-7.7%",
    metricPositive: false,
    filedKey: "may15-2142",
    price: 0.66,
    totalValue: 7_700,
    dateKey: "2026-05-15",
  },
  {
    id: "lt4",
    ticker: "MSFT",
    name: "Dan Crenshaw",
    titleKey: "rep",
    party: "R",
    side: "buy",
    metricLabel: "holdings",
    metricValue: "+4.2%",
    metricPositive: true,
    filedKey: "may15-2143",
    price: 412.5,
    totalValue: 420_000,
    dateKey: "2026-05-15",
  },
  {
    id: "lt5",
    ticker: "OM",
    name: "Josh Gottheimer",
    titleKey: "rep",
    party: "D",
    side: "sell",
    metricLabel: "outstanding",
    metricValue: "0.01%",
    filedKey: "may15-2148b",
    price: 3.7,
    totalValue: 9_800,
    dateKey: "2026-05-15",
  },
  {
    id: "lt6",
    ticker: "XOM",
    name: "Markwayne Mullin",
    titleKey: "sen",
    party: "R",
    side: "sell",
    metricLabel: "holdings",
    metricValue: "-16.1%",
    metricPositive: false,
    filedKey: "may14-1830",
    price: 104.2,
    totalValue: 575_000,
    dateKey: "2026-05-14",
  },
];

const INSIDER_TRADES: InsiderRow[] = [
  {
    id: "il1",
    ticker: "OM",
    name: "Brottem John L.",
    roleKey: "officer",
    side: "sell",
    badge: "stock",
    metricLabel: "outstanding",
    metricValue: "0.01%",
    filedKey: "may15-2148b",
    price: 3.7,
    totalValue: 9_800,
    dateKey: "2026-05-15",
  },
  {
    id: "il2",
    ticker: "PSQH",
    name: "Pena Michael",
    roleKey: "cfo",
    side: "sell",
    badge: "rsu",
    metricLabel: "holdings",
    metricValue: "-13.8%",
    metricPositive: false,
    filedKey: "may15-2144",
    price: 0.61,
    totalValue: 1_900,
    dateKey: "2026-05-15",
  },
  {
    id: "il3",
    ticker: "WRBY",
    name: "Wunderlich Dusty",
    roleKey: "officer",
    side: "sell",
    badge: "rsu",
    metricLabel: "holdings",
    metricValue: "-7.7%",
    metricPositive: false,
    filedKey: "may15-2142",
    price: 0.66,
    totalValue: 7_700,
    dateKey: "2026-05-15",
  },
  {
    id: "il4",
    ticker: "PSQH",
    name: "Rinn James",
    roleKey: "cfo",
    side: "sell",
    badge: "rsu",
    metricLabel: "holdings",
    metricValue: "-8.9%",
    metricPositive: false,
    filedKey: "may15-2143",
    price: 0.59,
    totalValue: 7_500,
    dateKey: "2026-05-15",
  },
  {
    id: "il5",
    ticker: "WRBY",
    name: "SINGER BRADLEY E",
    roleKey: "director",
    side: "sell",
    badge: "stock",
    metricLabel: "holdings",
    metricValue: "-16.1%",
    metricPositive: false,
    filedKey: "may14-1830",
    price: 6.55,
    totalValue: 575_000,
    dateKey: "2026-05-14",
  },
  {
    id: "il6",
    ticker: "FLEX",
    name: "Smith David K.",
    roleKey: "ceo",
    side: "sell",
    badge: "stock",
    metricLabel: "holdings",
    metricValue: "-5.3%",
    metricPositive: false,
    filedKey: "may13-1600",
    price: 23.1,
    totalValue: 210_000,
    dateKey: "2026-05-13",
  },
];

function formatPrice(n: number): string {
  return `$${n.toFixed(2)}`;
}

function formatTotal(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toLocaleString()}`;
}

function filedMap(locale: Locale): Record<string, string> {
  void locale;
  return {
    "may15-2148": "5月15日 · 21:48",
    "may15-2144": "5月15日 · 21:44",
    "may15-2142": "5月15日 · 21:42",
    "may15-2143": "5月15日 · 21:43",
    "may15-2148b": "5月15日 · 21:48",
    "may14-1830": "5月14日 · 18:30",
    "may14-1745": "5月14日 · 17:45",
    "may13-1600": "5月13日 · 16:00",
  };
}

function dateChips(): LiveDateChip[] {
  return [
    { id: "2026-05-15", label: "5月15日" },
    { id: "2026-05-14", label: "5月14日" },
    { id: "2026-05-13", label: "5月13日" },
  ];
}

function roleTitle(
  m: ReturnType<typeof getMessages>,
  key: InsiderRow["roleKey"]
): string {
  const map = {
    cfo: m.trade.cfo,
    officer: m.trade.officer,
    director: m.trade.director,
    ceo: m.trade.ceo,
  };
  return map[key];
}

function mapRow(
  row: PoliticianRow | InsiderRow,
  m: ReturnType<typeof getMessages>,
  filed: Record<string, string>,
  mode: DataMode
): LiveTrade {
  if (mode === "politician" && "titleKey" in row) {
    return {
      id: row.id,
      ticker: row.ticker,
      displayName: row.name,
      title: localizePoliticianSeatTitle(m, row.titleKey, row.titleKey),
      showParty: true,
      party: row.party,
      side: row.side,
      disclosureBadge: m.live.disclosureType,
      metricLabel: row.metricLabel,
      metricValue: row.metricValue,
      metricPositive: row.metricPositive,
      filedDisplay: filed[row.filedKey] ?? row.filedKey,
      priceDisplay: formatPrice(row.price),
      totalValueDisplay: formatTotal(row.totalValue),
      dateKey: row.dateKey,
    };
  }

  const insider = row as InsiderRow;
  return {
    id: insider.id,
    ticker: insider.ticker,
    displayName: insider.name,
    title: roleTitle(m, insider.roleKey),
    showParty: false,
    side: insider.side,
    disclosureBadge:
      insider.badge === "rsu" ? m.live.disclosureRsu : m.live.disclosureType,
    metricLabel: insider.metricLabel,
    metricValue: insider.metricValue,
    metricPositive: insider.metricPositive,
    filedDisplay: filed[insider.filedKey] ?? insider.filedKey,
    priceDisplay: formatPrice(insider.price),
    totalValueDisplay: formatTotal(insider.totalValue),
    dateKey: insider.dateKey,
  };
}

export function buildLiveFeed(locale: Locale, dataMode: DataMode) {
  const m = getMessages(locale);
  const filed = filedMap(locale);
  const rows = dataMode === "insider" ? INSIDER_TRADES : POLITICIAN_TRADES;

  return {
    trades: rows.map((row) => mapRow(row, m, filed, dataMode)),
    dates: dateChips(),
    etClock: "4:39 AM",
    marketOpen: false,
  };
}

export async function fetchLiveFeed(locale: Locale, dataMode: DataMode) {
  const { fetchLiveFeedFromApi } = await import("@/api/services/live");
  return fetchLiveFeedFromApi(locale, dataMode);
}
