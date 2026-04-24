import { NextRequest, NextResponse } from 'next/server';
import { refreshMobileTokens } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { refreshToken } = await req.json();
    if (!refreshToken) {
      return NextResponse.json({ error: 'Refresh token is required' }, { status: 400 });
    }

    const { user, accessToken, refreshToken: nextRefreshToken } = await refreshMobileTokens(refreshToken);
    return NextResponse.json({
      accessToken,
      refreshToken: nextRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        emailVerified: user.email_verified,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Refresh failed' }, { status: 500 });
  }
}
