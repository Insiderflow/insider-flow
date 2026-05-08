import { NextRequest, NextResponse } from 'next/server';
import { logout } from '@/lib/auth';
import { getPublicAppUrlFromEnv } from '@/lib/publicAppUrl';

async function handle(req: NextRequest) {
  // Best-effort local cleanup (legacy session cookie)
  await logout();
  const originEnv = getPublicAppUrlFromEnv();
  const requestOrigin = new URL(req.url).origin;
  const isLocalRequest = requestOrigin.includes('localhost') || requestOrigin.includes('127.0.0.1');
  // In local dev, always use the current request origin to avoid redirecting to a dead port.
  const origin = isLocalRequest
    ? requestOrigin
    : originEnv && originEnv.startsWith('http')
      ? originEnv
      : requestOrigin;
  // Delegate to NextAuth signout so it clears its own cookies reliably
  const signoutUrl = new URL('/api/auth/signout', origin);
  signoutUrl.searchParams.set('callbackUrl', '/');
  return NextResponse.redirect(signoutUrl.toString());
}

export const POST = handle;
export const GET = handle;
