const POLITICIAN_KPI_IDS = new Set(["buys", "sells"]);
const INSIDER_KPI_IDS = new Set(["buys", "sells", "options", "plan_10b5"]);

export function visibleDashboardKpis<T extends { id: string }>(kpis: T[]): T[] {
  return kpis.filter((k) => POLITICIAN_KPI_IDS.has(k.id));
}

export function visibleInsiderDashboardKpis<T extends { id: string }>(kpis: T[]): T[] {
  return kpis.filter((k) => INSIDER_KPI_IDS.has(k.id));
}
