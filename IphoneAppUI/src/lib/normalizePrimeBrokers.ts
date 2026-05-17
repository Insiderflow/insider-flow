import type { PrimeBrokerItem } from "@/data/mockData";

/** Old dashboard bug: tickers (WGS) were shown as broker names without id/industryCount. */
export function isLegacyTickerPrimeBroker(b: PrimeBrokerItem): boolean {
  if (b.id && typeof b.industryCount === "number") return false;
  const name = (b.name || "").trim();
  if (!name) return true;
  if (name.includes(" ")) return false;
  return /^[A-Z0-9.-]{1,8}$/.test(name);
}

export function normalizePrimeBrokers(
  items: PrimeBrokerItem[] | undefined
): PrimeBrokerItem[] {
  if (!items?.length) return [];

  return items
    .filter((b) => !isLegacyTickerPrimeBroker(b))
    .map((b) => ({
      ...b,
      id:
        b.id ||
        b.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "") ||
        "broker",
      industryCount: typeof b.industryCount === "number" ? b.industryCount : 0,
    }));
}

export function hasLegacyPrimeBrokers(items: PrimeBrokerItem[] | undefined): boolean {
  return (items ?? []).some(isLegacyTickerPrimeBroker);
}
