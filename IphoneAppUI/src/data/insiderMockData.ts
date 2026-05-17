import { getMessages } from "@/i18n/messages";
import type { Locale } from "@/i18n/types";
import {
  BASE,
  genSpike,
  industryName,
  type DashboardPayload,
  type Party,
  type TradeSide,
} from "./mockData";
import { buildInsiderDashboardExtras } from "./insiderEntities";
import { enrichIndustryChain } from "@/lib/industryChainModel";

type RoleKey = "cfo" | "officer" | "director" | "ceo";

function roleTitle(m: ReturnType<typeof getMessages>, key: RoleKey): string {
  const map: Record<RoleKey, string> = {
    cfo: m.trade.cfo,
    officer: m.trade.officer,
    director: m.trade.director,
    ceo: m.trade.ceo,
  };
  return map[key];
}

export function buildInsiderDashboard(locale: Locale): DashboardPayload {
  const m = getMessages(locale);
  const mi = m.mockInsider;

  return {
    meta: { ...m.mock.meta },
    aiSummary: {
      headline: mi.aiSummary.headline,
      narrative: mi.aiSummary.narrative,
      bullets: mi.aiSummary.bullets,
      sentiment: "mixed",
    },
    kpis: [
      { id: "buys", label: m.kpi.buys, value: 1243, changePct: 8.6, spike: genSpike(11, 14, "up") },
      { id: "sells", label: m.kpi.sells, value: 1589, changePct: 5.1, spike: genSpike(12, 14, "down") },
      { id: "options", label: m.kpi.options, value: 312, changePct: -2.4, spike: genSpike(13, 14, "mixed") },
      { id: "pp_sale", label: m.kpi.ppSale, value: 86, changePct: 11.2, spike: genSpike(14, 14, "up") },
    ],
    clusterBuys: BASE.clusterBuys.map((c: (typeof BASE.clusterBuys)[number]) => {
      const text = mi.clusters[c.id]!;
      return { ...c, title: text.title, subtitle: text.subtitle };
    }),
    clusterSells: BASE.clusterSells.map((c: (typeof BASE.clusterSells)[number]) => {
      const text = mi.clusters[c.id]!;
      return { ...c, title: text.title, subtitle: text.subtitle };
    }),
    topPoliticianBuys: [
      {
        id: "ib1",
        name: "Pena Michael",
        title: roleTitle(m, "cfo"),
        titleKey: "rep",
        party: "D" as Party,
        state: "PSQH",
        ticker: "PSQH",
        issuer: "PSQ Holdings",
        amount: 420_000,
        shares: 680_000,
        tradeDate: "May 15",
        side: "buy" as TradeSide,
        spike: genSpike(60, 12, "up"),
      },
      {
        id: "ib2",
        name: "Rinn James",
        title: roleTitle(m, "cfo"),
        titleKey: "rep",
        party: "D" as Party,
        state: "PSQH",
        ticker: "PSQH",
        issuer: "PSQ Holdings",
        amount: 380_000,
        shares: 610_000,
        tradeDate: "May 15",
        side: "buy" as TradeSide,
        spike: genSpike(61, 12, "up"),
      },
      {
        id: "ib3",
        name: "Wunderlich Dusty",
        title: roleTitle(m, "officer"),
        titleKey: "rep",
        party: "R" as Party,
        state: "WRBY",
        ticker: "WRBY",
        issuer: "Warby Parker",
        amount: 290_000,
        shares: 45_000,
        tradeDate: "May 14",
        side: "buy" as TradeSide,
        spike: genSpike(62, 12, "up"),
      },
    ],
    topPoliticianSells: [
      {
        id: "is1",
        name: "Brottem John L.",
        title: roleTitle(m, "officer"),
        titleKey: "rep",
        party: "R" as Party,
        state: "OM",
        ticker: "OM",
        issuer: "Outset Medical",
        amount: 9_800,
        shares: 2650,
        tradeDate: "May 15",
        side: "sell" as TradeSide,
        spike: genSpike(70, 12, "down"),
      },
      {
        id: "is2",
        name: "SINGER BRADLEY E",
        title: roleTitle(m, "director"),
        titleKey: "rep",
        party: "D" as Party,
        state: "WRBY",
        ticker: "WRBY",
        issuer: "Warby Parker",
        amount: 575_000,
        shares: 88_000,
        tradeDate: "May 15",
        side: "sell" as TradeSide,
        spike: genSpike(71, 12, "down"),
      },
      {
        id: "is3",
        name: "Smith David K.",
        title: roleTitle(m, "ceo"),
        titleKey: "rep",
        party: "R" as Party,
        state: "FLEX",
        ticker: "FLEX",
        issuer: "Flex Ltd",
        amount: 1_200_000,
        shares: 52_000,
        tradeDate: "May 14",
        side: "proposed_sale" as TradeSide,
        spike: genSpike(72, 12, "down"),
      },
    ],
    primeBrokers: BASE.primeBrokers,
    industryChain: enrichIndustryChain(
      BASE.industryChain.map((n: (typeof BASE.industryChain)[number]) => ({
        ...n,
        name: industryName(locale, n.nameKey),
        segments: n.segments?.map((s) => ({
          ...s,
          name: industryName(locale, s.nameKey),
        })),
      })),
    ),
    topIndustries: [
      { nameKey: "InformationTechnology", buyAmount: 12_400_000, sellAmount: 8_200_000 },
      { nameKey: "Energy", buyAmount: 4_700_000, sellAmount: 52_800_000 },
      { nameKey: "Healthcare", buyAmount: 6_600_000, sellAmount: 4_100_000 },
      { nameKey: "Financials", buyAmount: 3_200_000, sellAmount: 5_900_000 },
      { nameKey: "Industrials", buyAmount: 2_800_000, sellAmount: 3_400_000 },
    ].map((n) => ({
      ...n,
      name: industryName(locale, n.nameKey),
    })),
    recentTrades: BASE.recentTrades.slice(0, 4).map((t) => ({
      ...t,
      filedAt: m.mock.filedAt[t.filedAtKey] ?? t.filedAtKey,
    })),
    insiderExtras: buildInsiderDashboardExtras(locale),
  };
}
