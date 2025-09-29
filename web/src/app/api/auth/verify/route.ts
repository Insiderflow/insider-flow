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

    // Redirect to verification success page
    return NextResponse.redirect(new URL('/verification-success', req.url));

  } catch (error) {
    // Redirect to verification error page
    return NextResponse.redirect(new URL('/verification-error', req.url));
  }
}
