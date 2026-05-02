import { NextRequest, NextResponse } from 'next/server';
import { keyFromRequest, rateLimit } from '@/lib/rateLimit';
import { loginOrRegisterFacebookMobile } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const key = keyFromRequest(req, 'mobile:auth:facebook');
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
    const accessToken =
      typeof body === 'object' && body !== null && 'accessToken' in body &&
      typeof (body as { accessToken?: unknown }).accessToken === 'string'
        ? (body as { accessToken: string }).accessToken
        : '';

    if (!accessToken) {
      return NextResponse.json({ error: 'accessToken is required' }, { status: 400 });
    }

    const { user, accessToken: jwtAccess, refreshToken } =
      await loginOrRegisterFacebookMobile(accessToken);
    return NextResponse.json({
      accessToken: jwtAccess,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        emailVerified: user.email_verified,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message === 'Facebook login is not configured' ||
        error.message.includes('Facebook login is not configured')
      ) {
        return NextResponse.json({ error: error.message }, { status: 503 });
      }
      if (
        error.message.includes('Invalid Facebook') ||
        error.message.includes('Facebook profile')
      ) {
        return NextResponse.json({ error: 'Invalid Facebook session' }, { status: 401 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Facebook Sign-In failed' }, { status: 500 });
  }
}
