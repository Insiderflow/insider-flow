import { NextRequest, NextResponse } from 'next/server';
import { logout } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    await logout();
    const base = process.env.NEXT_PUBLIC_BASE_URL || '/';
    const redirectUrl = base.startsWith('http') ? base : new URL(base, req.url).toString();
    const res = NextResponse.redirect(redirectUrl);
    res.cookies.set('session', '', { maxAge: 0, path: '/' });
    return res;
    } catch {
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}
