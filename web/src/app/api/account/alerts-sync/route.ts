import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { isAdminUserEmail } from '@/lib/adminUsers';
import { getAlertsSyncState, runAlertsSyncJob } from '@/lib/alertsSyncJob';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

function forbidden() {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) return unauthorized();
  if (!isAdminUserEmail(user.email)) return forbidden();

  return NextResponse.json({
    ok: true,
    ...getAlertsSyncState(),
  });
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) return unauthorized();
  if (!isAdminUserEmail(user.email)) return forbidden();

  try {
    const result = await runAlertsSyncJob();
    const state = getAlertsSyncState();
    if (result.skipped) {
      return NextResponse.json(
        { ok: true, skipped: true, reason: result.reason, ...state },
        { status: 202 },
      );
    }
    return NextResponse.json({ ok: true, ...state });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'alerts sync failed' },
      { status: 500 },
    );
  }
}
