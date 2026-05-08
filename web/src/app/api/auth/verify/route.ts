import { NextRequest, NextResponse } from 'next/server';
import { verifyEmail } from '@/lib/auth';
import { getPublicAppUrlOrDefault } from '@/lib/publicAppUrl';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Verification token is required' }, { status: 400 });
    }

    await verifyEmail(token);

    // Redirect to verification success page
    const baseUrl = getPublicAppUrlOrDefault();
    return NextResponse.redirect(new URL('/verification-success', baseUrl));

  } catch {
    // Redirect to verification error page
    const baseUrl = getPublicAppUrlOrDefault();
    return NextResponse.redirect(new URL('/verification-error', baseUrl));
  }
}
