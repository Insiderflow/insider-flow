import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow Next internals and public assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/api/register') ||
    pathname.startsWith('/api/logout') ||
    pathname.startsWith('/register')
  ) {
    return NextResponse.next();
  }

  const userCookie = req.cookies.get('if_user');
  if (!userCookie) {
    const url = req.nextUrl.clone();
    url.pathname = '/register';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};


