import { NextRequest, NextResponse } from 'next/server';
import { verifyEmail } from '@/lib/auth';
import { getPublicAppUrlOrDefault } from '@/lib/publicAppUrl';

export async function GET(req: NextRequest) {
  const baseUrl = getPublicAppUrlOrDefault();
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    if (!token) {
      return NextResponse.redirect(new URL('/verification-error', baseUrl));
    }
    await verifyEmail(token);
    return NextResponse.redirect(new URL('/verification-success', baseUrl));
  } catch {
    return NextResponse.redirect(new URL('/verification-error', baseUrl));
  }
}
