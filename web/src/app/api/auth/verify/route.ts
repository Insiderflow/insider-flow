import { NextRequest, NextResponse } from 'next/server';
import { verifyEmail } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Verification token is required' }, { status: 400 });
    }

    const user = await verifyEmail(token);

    return NextResponse.json({ 
      message: 'Email verified successfully',
      user: {
        id: user.id,
        email: user.email,
        emailVerified: user.email_verified
      }
    });

  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Invalid verification token') {
        return NextResponse.json({ error: 'Invalid or expired verification token' }, { status: 400 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Email verification failed' }, { status: 500 });
  }
}
