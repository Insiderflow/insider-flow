import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  if (process.env.ADMIN_TOKEN && req.headers.get('x-admin-token') !== process.env.ADMIN_TOKEN) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'login required' }, { status: 401 });
  const { tier, days } = await req.json();
  const expires = tier === 'PAID' && days ? new Date(Date.now() + days * 86400000) : null;
  await prisma.user.update({
    where: { id: user.id },
    data: { membership_tier: tier === 'PAID' ? 'PAID' : 'FREE', membership_expires_at: expires },
  });
  return NextResponse.json({ ok: true });
}





