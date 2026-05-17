import type {
  InsiderEntityProfile,
  PoliticianChartPoint,
  PoliticianProfileCharts,
  PoliticianTopIssuer,
} from "@/data/insiderEntities";

function quarterKey(isoDate: string): string {
  const d = new Date(isoDate);
  const year = d.getUTCFullYear();
  const quarter = Math.floor(d.getUTCMonth() / 3) + 1;
  return `${year}-Q${quarter}`;
}

/** Client-side chart fallback when API omitted politicianCharts (uses trade list only). */
export function buildPoliticianChartsFromTrades(
  profile: Pick<InsiderEntityProfile, "recentTrades" | "allTradesCount">
): PoliticianProfileCharts {
  const trades = profile.recentTrades;

  const issuerCounts = new Map<string, PoliticianTopIssuer>();
  for (const tr of trades) {
    const key = tr.ticker || tr.id;
    const cur = issuerCounts.get(key) || {
      issuerId: key,
      name: tr.ticker || "Unknown",
      ticker: tr.ticker || null,
      count: 0,
    };
    cur.count += 1;
    issuerCounts.set(key, cur);
  }

  const topIssuers = [...issuerCounts.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const chartMap = new Map<string, { buyVolume: number; sellVolume: number }>();
  for (const tr of trades) {
    const period = quarterKey(tr.tradeDate);
    const cur = chartMap.get(period) || { buyVolume: 0, sellVolume: 0 };
    if (tr.side === "buy") cur.buyVolume += tr.amount;
    else cur.sellVolume += tr.amount;
    chartMap.set(period, cur);
  }

  const chartPoints: PoliticianChartPoint[] = [...chartMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, v]) => ({
      period,
      buyVolume: v.buyVolume,
      sellVolume: v.sellVolume,
      sp500Close: null,
    }));

  const amounts = trades.map((t) => t.amount);
  const maxTrade = amounts.length ? Math.max(...amounts) : 0;
  const totalVolume = amounts.reduce((s, n) => s + n, 0);
  const lastTraded =
    trades.length > 0
      ? trades.reduce((latest, tr) => (tr.tradeDate > latest ? tr.tradeDate : latest), trades[0].tradeDate)
      : null;

  return {
    stats: {
      totalTrades: profile.allTradesCount,
      issuerCount: issuerCounts.size,
      totalVolume,
      maxTrade,
      lastTraded,
    },
    topIssuers,
    chartPoints,
  };
}

export function ensurePoliticianCharts(
  profile: InsiderEntityProfile
): InsiderEntityProfile {
  if (profile.entityType !== "person" || profile.id.startsWith("person-")) {
    return profile;
  }
  if (profile.politicianCharts?.chartPoints.length) return profile;
  return {
    ...profile,
    politicianCharts: buildPoliticianChartsFromTrades(profile),
  };
}
