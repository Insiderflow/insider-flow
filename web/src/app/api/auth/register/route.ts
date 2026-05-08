import { NextRequest, NextResponse } from 'next/server';
import { createUser } from '@/lib/auth';
import { sendVerificationEmail } from '@/lib/email';
import { keyFromRequest, rateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    const rl = rateLimit(keyFromRequest(req, 'auth:register'), 10, 0.2);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const { name, email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const user = await createUser(email, password, name);
    if (user.email_verification_token) {
      await sendVerificationEmail(email, user.email_verification_token);
    }

    return NextResponse.json({
      message: 'Registration successful. Please verify your email first.',
      user_id: user.id,
      requires_verification: true,
    });

  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'User already exists') {
        return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
