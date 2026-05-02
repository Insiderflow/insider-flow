import { NextRequest, NextResponse } from 'next/server';
import { keyFromRequest, rateLimit } from '@/lib/rateLimit';
import { loginOrRegisterGoogleMobile } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const key = keyFromRequest(req, 'mobile:auth:google');
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
    const idToken =
      typeof body === 'object' && body !== null && 'idToken' in body &&
      typeof (body as { idToken?: unknown }).idToken === 'string'
        ? (body as { idToken: string }).idToken
        : '';

    if (!idToken) {
      return NextResponse.json({ error: 'idToken is required' }, { status: 400 });
    }

    const { user, accessToken, refreshToken } = await loginOrRegisterGoogleMobile(idToken);
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
      if (
        error.message === 'Google Sign-In is not configured' ||
        error.message.includes('Google Sign-In is not configured')
      ) {
        return NextResponse.json({ error: error.message }, { status: 503 });
      }
      if (
        error.message.startsWith('Invalid Google token') ||
        error.message === 'Invalid Google token audience'
      ) {
        return NextResponse.json({ error: 'Invalid Google identity token' }, { status: 401 });
      }
      const joseLike =
        /JWT/i.test(error.message) ||
        error.name === 'JWTExpired' ||
        error.name === 'JWSSignatureVerificationFailed';
      if (joseLike) {
        return NextResponse.json({ error: 'Invalid Google identity token' }, { status: 401 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Google Sign-In failed' }, { status: 500 });
  }
}
