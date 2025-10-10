import { NextRequest, NextResponse } from 'next/server';
import { logout } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    await logout();
    const res = NextResponse.redirect(new URL('/', req.url));
    res.cookies.set('session', '', { maxAge: 0, path: '/' });
    return res;
    } catch {
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}
