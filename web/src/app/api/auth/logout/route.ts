import { NextRequest, NextResponse } from 'next/server';
import { logout } from '@/lib/auth';

async function handle(req: NextRequest) {
  // Best-effort local cleanup (legacy session cookie)
  await logout();
  const originEnv = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL;
  const origin = originEnv && originEnv.startsWith('http') ? originEnv : new URL(req.url).origin;
  // Delegate to NextAuth signout so it clears its own cookies reliably
  const signoutUrl = new URL('/api/auth/signout', origin);
  signoutUrl.searchParams.set('callbackUrl', '/');
  return NextResponse.redirect(signoutUrl.toString());
}

export const POST = handle;
export const GET = handle;
