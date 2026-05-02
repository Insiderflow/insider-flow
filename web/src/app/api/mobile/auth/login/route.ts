import { NextRequest, NextResponse } from 'next/server';
import { keyFromRequest, rateLimit } from '@/lib/rateLimit';
import { loginMobile, OAUTH_ONLY_ACCOUNT_MESSAGE } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const key = keyFromRequest(req, 'mobile:auth:login');
    const rl = rateLimit(key, 10, 0.5);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const email = typeof body === 'object' && body !== null && 'email' in body ? String((body as { email?: unknown }).email ?? '') : '';
    const password =
      typeof body === 'object' && body !== null && 'password' in body
        ? String((body as { password?: unknown }).password ?? '')
        : '';
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const { user, accessToken, refreshToken } = await loginMobile(email, password);
    return NextResponse.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        emailVerified: user.email_verified,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Invalid credentials') {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
      }
      if (error.message === OAUTH_ONLY_ACCOUNT_MESSAGE) {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
