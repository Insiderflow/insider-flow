import { NextRequest, NextResponse } from 'next/server';
import { logout } from '@/lib/auth';

async function handle(req: NextRequest) {
  // Best-effort logout; never throw
  await logout();
  const redirectUrl = new URL('/', req.url).toString();
  const res = NextResponse.redirect(redirectUrl);
  res.cookies.set('session', '', { maxAge: 0, path: '/' });
  // Also clear NextAuth session cookies if present
  res.cookies.set('next-auth.session-token', '', { maxAge: 0, path: '/' });
  res.cookies.set('__Secure-next-auth.session-token', '', { maxAge: 0, path: '/' });
  return res;
}

export const POST = handle;
export const GET = handle;
