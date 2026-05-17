import { USE_API, USE_SNAPSHOT } from '@/api/config';
import { mobileApi, type SearchResult } from '@/api/endpoints';
import { searchSnapshotIndex } from '@/api/snapshots';

export type { SearchResult };

export async function searchEntities(q: string): Promise<SearchResult[]> {
  const term = q.trim();
  if (term.length < 2) return [];

  if (USE_API) {
    try {
      const res = await mobileApi.search(term);
      return res.results ?? [];
    } catch (e) {
      console.warn('[api] search failed', e);
      if (USE_SNAPSHOT) return searchSnapshotIndex(term);
    }
  }

  if (USE_SNAPSHOT) return searchSnapshotIndex(term);

  return [];
}
