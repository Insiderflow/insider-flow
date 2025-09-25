import { NextRequest, NextResponse } from 'next/server';

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const email = String(form.get('email') || '').trim();
    const next = String(form.get('next') || '/');

    // Validate email
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Check if email is too long
    if (email.length > 254) {
      return NextResponse.json({ error: 'Email is too long' }, { status: 400 });
    }

    // Simulate registration process (in real app, this would save to database)
    const res = NextResponse.redirect(new URL(next, req.url));
    
    // Set a simple cookie to simulate registration
    res.cookies.set('if_user', email, { 
      httpOnly: false, 
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    
    return res;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 });
  }
}


