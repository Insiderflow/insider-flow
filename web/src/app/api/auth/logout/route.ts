import { NextRequest, NextResponse } from 'next/server';
import { logout } from '@/lib/auth';

async function handle(req: NextRequest) {
  // Best-effort logout; never throw
  await logout();
  const originEnv = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL;
  const origin = originEnv && originEnv.startsWith('http') ? originEnv : new URL(req.url).origin;
  const redirectUrl = new URL('/', origin).toString();
  const res = NextResponse.redirect(redirectUrl);
  res.cookies.set('session', '', { maxAge: 0, path: '/' });
  // Also clear NextAuth session cookies if present
  res.cookies.set('next-auth.session-token', '', { maxAge: 0, path: '/' });
  res.cookies.set('__Secure-next-auth.session-token', '', { maxAge: 0, path: '/' });
  return res;
}

export const POST = handle;
export const GET = handle;
