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

    // Redirect to home page with success message
    return NextResponse.redirect(new URL('/?verified=true', req.url));

  } catch (error) {
    // Redirect to home page with error message
    const errorMessage = error instanceof Error && error.message === 'Invalid verification token' 
      ? 'invalid' 
      : 'failed';
    return NextResponse.redirect(new URL(`/?verification=${errorMessage}`, req.url));
  }
}
