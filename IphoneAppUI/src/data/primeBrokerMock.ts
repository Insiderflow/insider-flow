import type { PrimeBrokerDetail } from "@/data/mockData";

export const MOCK_PRIME_BROKER_DETAILS: Record<string, PrimeBrokerDetail> = {
  "morgan-stanley": {
    id: "morgan-stanley",
    name: "Morgan Stanley",
    flowAmount: 142_300_000,
    industryCount: 29,
    industries: [
      { nameKey: "InformationTechnology", name: "Information Technology", amount: 38_200_000, tradeCount: 42, pct: 27 },
      { nameKey: "HealthCare", name: "Health Care", amount: 24_100_000, tradeCount: 31, pct: 17 },
      { nameKey: "Financials", name: "Financials", amount: 19_800_000, tradeCount: 28, pct: 14 },
      { nameKey: "ConsumerDiscretionary", name: "Consumer Discretionary", amount: 15_400_000, tradeCount: 22, pct: 11 },
      { nameKey: "Energy", name: "Energy", amount: 12_600_000, tradeCount: 18, pct: 9 },
    ],
  },
  "goldman-sachs": {
    id: "goldman-sachs",
    name: "Goldman Sachs",
    flowAmount: 206_000_000,
    industryCount: 13,
    industries: [
      { nameKey: "InformationTechnology", name: "Information Technology", amount: 52_400_000, tradeCount: 58, pct: 25 },
      { nameKey: "Industrials", name: "Industrials", amount: 41_200_000, tradeCount: 44, pct: 20 },
      { nameKey: "CommunicationServices", name: "Communication Services", amount: 33_800_000, tradeCount: 36, pct: 16 },
      { nameKey: "Materials", name: "Materials", amount: 28_500_000, tradeCount: 30, pct: 14 },
    ],
  },
};
