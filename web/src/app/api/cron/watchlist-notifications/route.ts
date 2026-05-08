import { NextRequest, NextResponse } from 'next/server';
import { runWatchlistNotificationSweep } from '@/lib/services/watchlistNotificationService';

function checkInternalAuth(request: NextRequest) {
  const auth = request.headers.get('authorization') || '';
  const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : '';
  return Boolean(process.env.INTERNAL_JOBS_SECRET && token === process.env.INTERNAL_JOBS_SECRET);
}

export async function POST(request: NextRequest) {
  if (!checkInternalAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const minutes = Math.max(1, Math.min(24 * 60, Number(body.minutes || 30)));
  const result = await runWatchlistNotificationSweep(minutes);
  return NextResponse.json({ ok: true, ...result });
}
