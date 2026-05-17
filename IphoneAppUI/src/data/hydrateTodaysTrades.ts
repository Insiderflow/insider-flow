import type { DashboardPayload, PoliticianTradeHighlight } from "@/data/mockData";
import { etCalendarYmd } from "@/lib/etDate";

/** Demo rows for UI review when API/snapshot has no ET-today trades. */
export function hydrateTodaysTrades(data: DashboardPayload): DashboardPayload {
  if (data.todaysTrades && data.todaysTrades.length > 0) return data;

  const today = etCalendarYmd();
  const pool: PoliticianTradeHighlight[] = [
    ...data.topPoliticianBuys,
    ...data.topPoliticianSells,
  ];
  if (pool.length === 0) return data;

  const todaysTrades = pool.slice(0, 5).map((t, i) => ({
    ...t,
    id: `today-demo-${t.politicianId ?? t.id}-${i}`,
    tradeDate: today,
  }));

  const buysToday = todaysTrades.filter((t) => t.side === "buy").length;
  const sellsToday = todaysTrades.filter((t) => t.side !== "buy").length;

  const bullets = [...data.aiSummary.bullets];
  if (bullets[0]?.includes("filed today") || bullets[0]?.includes("今日")) {
    bullets[0] =
      buysToday + sellsToday > 0
        ? `${buysToday} buys · ${sellsToday} sells today (ET).`
        : bullets[0];
  }

  return {
    ...data,
    todaysTrades,
    aiSummary: { ...data.aiSummary, bullets },
  };
}
