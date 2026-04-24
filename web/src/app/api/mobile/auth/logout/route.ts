import { NextRequest, NextResponse } from 'next/server';
import { logoutMobile } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const refreshToken = typeof body?.refreshToken === 'string' ? body.refreshToken : null;
    await logoutMobile(refreshToken);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
