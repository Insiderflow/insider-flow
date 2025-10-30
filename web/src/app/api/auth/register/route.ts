import { NextRequest, NextResponse } from 'next/server';
import { createUser, createSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const user = await createUser(email, password);

    // Immediately mark verified and clear token
    await prisma.user.update({
      where: { id: user.id },
      data: { email_verified: true, email_verification_token: null },
    });

    // Auto-login: create session and set cookie
    const sessionToken = await createSession(user.id);
    const res = NextResponse.json({
      message: 'Registration successful. You are now logged in.',
      user_id: user.id,
    });
    res.cookies.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });
    return res;

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
