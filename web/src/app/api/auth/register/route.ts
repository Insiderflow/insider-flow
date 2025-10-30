import { NextRequest, NextResponse } from 'next/server';
import { createUser } from '@/lib/auth';
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

    // Do NOT auto-login; client will redirect to a success screen
    return NextResponse.json({
      message: 'Registration successful. Please login with your email and password.',
      user_id: user.id,
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
