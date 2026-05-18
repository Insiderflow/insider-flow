import { mobileApi, type MobileDiscoverPayload } from "@/api/endpoints";
import type { Period } from "@/data/mockData";
import { USE_API } from "@/api/config";

export type { MobileDiscoverPayload };

const EMPTY: MobileDiscoverPayload = {
  activePoliticians: [],
  activeTickers: [],
  recentFlagged: [],
};

export async function fetchDiscoverFromApi(
  period: Period = "7D",
): Promise<MobileDiscoverPayload> {
  if (!USE_API) return EMPTY;
  try {
    return await mobileApi.discover(period);
  } catch (e) {
    console.warn("[api] discover failed", e);
    return EMPTY;
  }
}
