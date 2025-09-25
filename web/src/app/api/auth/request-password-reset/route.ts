import { NextRequest, NextResponse } from 'next/server';
import { requestPasswordReset } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    await requestPasswordReset(email);
    return NextResponse.json({ ok: true });

  } catch (error) {
    return NextResponse.json({ error: 'Password reset request failed' }, { status: 500 });
  }
}
