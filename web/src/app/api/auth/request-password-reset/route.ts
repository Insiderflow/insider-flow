import { NextRequest, NextResponse } from 'next/server';
import { requestPasswordReset } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    await requestPasswordReset(email);
    // Always return success to avoid revealing if user exists
    return NextResponse.json({ ok: true, message: 'If an account exists, a password reset link has been sent.' });

  } catch (error) {
    console.error('[password reset API] Error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Still return success to avoid revealing errors, but log them
    // In production, you might want to return a generic error
    return NextResponse.json({ 
      ok: true, 
      message: 'If an account exists, a password reset link has been sent.' 
    });
  }
}
