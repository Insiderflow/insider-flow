import { NextRequest, NextResponse } from 'next/server';
import { resetPassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const user = await resetPassword(token, password);

    return NextResponse.json({ 
      message: 'Password reset successful',
      user: {
        id: user.id,
        email: user.email
      }
    });

  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Invalid or expired reset token') {
        return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Password reset failed' }, { status: 500 });
  }
}
