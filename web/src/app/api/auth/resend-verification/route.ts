import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendVerificationEmail } from '@/lib/emailService';
import crypto from 'crypto';
import { rateLimit, keyFromRequest } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  const key = keyFromRequest(req, 'auth:resend');
  const rl = rateLimit(key, 5, 0.2);
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ ok: true }); // hide enumeration
  if (user.email_verified) return NextResponse.json({ ok: true });

  const token = crypto.randomBytes(32).toString('hex');
  await prisma.user.update({ where: { id: user.id }, data: { email_verification_token: token } });
  await sendVerificationEmail(email, token);
  return NextResponse.json({ ok: true });
}


