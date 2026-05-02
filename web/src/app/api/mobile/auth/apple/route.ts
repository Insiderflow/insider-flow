import { NextRequest, NextResponse } from 'next/server';
import { keyFromRequest, rateLimit } from '@/lib/rateLimit';
import { loginOrRegisterAppleMobile } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const key = keyFromRequest(req, 'mobile:auth:apple');
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
    const identityToken =
      typeof body === 'object' && body !== null && 'identityToken' in body &&
      typeof (body as { identityToken?: unknown }).identityToken === 'string'
        ? (body as { identityToken: string }).identityToken
        : '';
    if (!identityToken) {
      return NextResponse.json({ error: 'identityToken is required' }, { status: 400 });
    }

    const { user, accessToken, refreshToken } = await loginOrRegisterAppleMobile(identityToken);
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
      if (error.message === 'Apple Sign-In is not configured') {
        return NextResponse.json({ error: error.message }, { status: 503 });
      }
      if (error.message.startsWith('Invalid Apple token')) {
        return NextResponse.json({ error: 'Invalid Apple identity token' }, { status: 401 });
      }
      const joseLike =
        /JWT/i.test(error.message) ||
        error.name === 'JWTExpired' ||
        error.name === 'JWSSignatureVerificationFailed';
      if (joseLike) {
        return NextResponse.json({ error: 'Invalid Apple identity token' }, { status: 401 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Apple Sign-In failed' }, { status: 500 });
  }
}
