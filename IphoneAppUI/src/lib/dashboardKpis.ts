/** KPI cards shown on politician / insider dashboard overview. */
const VISIBLE_KPI_IDS = new Set(["buys", "sells"]);

export function visibleDashboardKpis<T extends { id: string }>(kpis: T[]): T[] {
  return kpis.filter((k) => VISIBLE_KPI_IDS.has(k.id));
}
