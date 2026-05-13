import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken) {
    return NextResponse.json({ error: 'admin token not configured' }, { status: 503 });
  }

  if (req.headers.get('x-admin-token') !== adminToken) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: '請先登入' }, { status: 401 });
  const { tier, days } = await req.json();
  if (tier !== 'PAID' && tier !== 'FREE') {
    return NextResponse.json({ error: 'invalid tier' }, { status: 400 });
  }
  const expires = tier === 'PAID' && days ? new Date(Date.now() + days * 86400000) : null;
  await prisma.user.update({
    where: { id: user.id },
    data: {
      membership_tier: tier === 'PAID' ? 'PAID' : 'FREE',
      membership_expires_at: expires,
      subscription_status: tier === 'PAID' ? 'active' : 'free',
      billing_provider: tier === 'PAID' ? 'stripe' : null,
      subscription_entitlement_id: null,
      subscription_last_synced_at: new Date(),
    },
  });
  return NextResponse.json({ ok: true });
}






















