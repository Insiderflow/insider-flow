import { NextRequest, NextResponse } from 'next/server';
import { disableNotificationSetting } from '@/lib/repos/notificationRepo';
import { verifyUnsubscribeSignature } from '@/lib/email';
import { getPublicAppUrlOrDefault } from '@/lib/publicAppUrl';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const userId = url.searchParams.get('u');
  const key = url.searchParams.get('k');
  const sig = url.searchParams.get('sig');

  if (!userId || !key || !sig) {
    return NextResponse.redirect(new URL('/?unsubscribe=invalid', getPublicAppUrlOrDefault()));
  }
  if (!verifyUnsubscribeSignature(userId, key, sig)) {
    return NextResponse.redirect(new URL('/?unsubscribe=invalid', getPublicAppUrlOrDefault()));
  }
  if (key !== 'watchlistUpdates') {
    return NextResponse.redirect(new URL('/?unsubscribe=invalid', getPublicAppUrlOrDefault()));
  }

  await disableNotificationSetting(userId, 'watchlistUpdates');
  return NextResponse.redirect(new URL('/?unsubscribe=success', getPublicAppUrlOrDefault()));
}
