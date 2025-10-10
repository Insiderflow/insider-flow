import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.pathname;

  const requiresAuth = ['/trades', '/politicians', '/issuers'].some(p => url.startsWith(p));
  const requiresPaid = false; // Paid gating handled via SSR redirect to avoid Prisma in edge

  if (!requiresAuth && !requiresPaid) return NextResponse.next();

  const sessionToken = (await cookies()).get('session')?.value;
  if (!sessionToken) return NextResponse.redirect(new URL('/login?next=' + encodeURIComponent(req.nextUrl.pathname), req.url));

  // Only check cookie presence here; actual auth/paid checks handled server-side to keep middleware edge-safe

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/trades/:path*',
    '/politicians/:path*',
    '/issuers/:path*',
    '/insider/:path*',
  ],
};


