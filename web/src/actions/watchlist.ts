'use server';

import { getSessionUser } from '@/lib/auth';
import { togglePoliticianWatchlist } from '@/lib/repos/watchlistRepo';

export async function toggleWatchlistAction(input: { politicianId: string }) {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false as const, error: '請先登入' };
  }
  if (!input.politicianId) {
    return { ok: false as const, error: 'Missing politicianId' };
  }

  const result = await togglePoliticianWatchlist(user.id, input.politicianId);
  return { ok: true as const, watching: result.watching };
}
