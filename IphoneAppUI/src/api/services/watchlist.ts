import { USE_FIXTURE_BUILDERS } from '@/api/config';
import { ApiError } from '@/api/client';
import { mobileApi, type WatchlistItem } from '@/api/endpoints';

export type WatchlistType = 'politician' | 'company' | 'owner' | 'stock';

export type WatchlistTarget = {
  type: WatchlistType;
  politicianId?: string;
  companyId?: string;
  ownerId?: string;
  ticker?: string;
};

function targetParams(target: WatchlistTarget): Record<string, string> {
  const params: Record<string, string> = { type: target.type };
  if (target.politicianId) params.politicianId = target.politicianId;
  if (target.companyId) params.companyId = target.companyId;
  if (target.ownerId) params.ownerId = target.ownerId;
  if (target.ticker) params.ticker = target.ticker.toUpperCase();
  return params;
}

export async function fetchWatchlist(): Promise<WatchlistItem[]> {
  if (USE_FIXTURE_BUILDERS) return [];
  try {
    return await mobileApi.watchlist();
  } catch {
    return [];
  }
}

export async function isOnWatchlist(target: WatchlistTarget): Promise<boolean> {
  if (USE_FIXTURE_BUILDERS) return false;
  try {
    const items = await mobileApi.watchlist(targetParams(target));
    return items.length > 0;
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) return false;
    return false;
  }
}

export async function addToWatchlist(target: WatchlistTarget): Promise<void> {
  await mobileApi.watchlistAdd({
    type: target.type,
    politicianId: target.politicianId,
    companyId: target.companyId,
    ownerId: target.ownerId,
    ticker: target.ticker?.toUpperCase(),
  });
}

export async function removeFromWatchlist(target: WatchlistTarget): Promise<void> {
  await mobileApi.watchlistRemove(targetParams(target));
}

export async function toggleWatchlist(
  target: WatchlistTarget,
  currentlyWatching: boolean
): Promise<boolean> {
  if (currentlyWatching) {
    await removeFromWatchlist(target);
    return false;
  }
  await addToWatchlist(target);
  return true;
}
