import { NextRequest, NextResponse } from 'next/server';
import { createUser } from '@/lib/auth';
import { sendVerificationEmail } from '@/lib/emailService';

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

    // Send verification email
    let emailSent = false;
    let emailError = null;
    try {
      await sendVerificationEmail(email, user.email_verification_token!);
      emailSent = true;
    } catch (error) {
      console.error('Failed to send verification email:', error);
      emailError = error.message;
    }

    return NextResponse.json({ 
      message: emailSent 
        ? 'Registration successful! Please check your email to verify your account.'
        : 'Registration successful, but email verification failed. Please contact support.',
      user_id: user.id,
      email_sent: emailSent,
      email_error: emailError,
      debug: {
        sendgrid_key: process.env.SENDGRID_API_KEY ? 'Set' : 'Missing',
        sendgrid_from: process.env.SENDGRID_FROM_EMAIL || 'Missing',
        nextauth_url: process.env.NEXTAUTH_URL || 'Missing'
      }
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
