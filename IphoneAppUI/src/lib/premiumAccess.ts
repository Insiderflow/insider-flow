import type { TabId } from "@/components/layout/TabBar";

/** Paths free (logged-in) users can open without upgrading. */
export function isFreeTierPath(pathname: string): boolean {
  if (pathname === "/") return true;
  if (pathname.startsWith("/settings")) return true;
  if (pathname.startsWith("/paywall")) return true;
  if (pathname.startsWith("/legal/")) return true;
  return false;
}

export function isPremiumTab(tab: TabId): boolean {
  return tab === "live" || tab === "signals" || tab === "search";
}

export function postAuthRedirectPath(from: string, isPaid: boolean): string {
  const target = from || "/";
  if (isPaid) return target;
  if (target === "/paywall" || target.startsWith("/settings")) return target;
  if (isFreeTierPath(target)) return target;
  return "/";
}
