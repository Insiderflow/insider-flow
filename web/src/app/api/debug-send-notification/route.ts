import { NextRequest, NextResponse } from 'next/server';
import { keyFromRequest, rateLimit } from '@/lib/rateLimit';
import { runWatchlistNotificationSweep } from '@/lib/services/watchlistNotificationService';

function isAuthorized(request: NextRequest) {
  const headerToken = request.headers.get('x-admin-token');
  const queryToken =
    process.env.NODE_ENV === 'production'
      ? null
      : new URL(request.url).searchParams.get('token');
  const token = headerToken || queryToken;
  return Boolean(process.env.ADMIN_TOKEN && token === process.env.ADMIN_TOKEN);
}

export async function POST(request: NextRequest) {
  const rl = rateLimit(keyFromRequest(request, 'debug:send-notification'), 5, 0.1);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const minutes = Math.max(1, Math.min(24 * 60, Number(body.minutes || 60)));
  const result = await runWatchlistNotificationSweep(minutes);
  return NextResponse.json({ ok: true, ...result });
}
