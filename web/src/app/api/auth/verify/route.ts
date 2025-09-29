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
    const baseUrl = process.env.NEXTAUTH_URL || 'https://insiderflow.asia';
    return NextResponse.redirect(new URL('/verification-success', baseUrl));

  } catch (error) {
    // Redirect to verification error page
    const baseUrl = process.env.NEXTAUTH_URL || 'https://insiderflow.asia';
    return NextResponse.redirect(new URL('/verification-error', baseUrl));
  }
}
