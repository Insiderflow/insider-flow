import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'login required' }, { status: 401 });

    const { priceId } = await req.json();
    if (!priceId) return NextResponse.json({ error: 'priceId required' }, { status: 400 });

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-09-30.clover' });

    // Ensure customer
    const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { stripe_customer_id: true, email: true } });
    let customerId = dbUser?.stripe_customer_id || null;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: dbUser?.email || undefined });
      customerId = customer.id;
      await prisma.user.update({ where: { id: user.id }, data: { stripe_customer_id: customerId } });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${req.nextUrl.origin}/account?status=success`,
      cancel_url: `${req.nextUrl.origin}/upgrade?status=cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    console.error('checkout error', e);
    return NextResponse.json({ error: 'checkout failed' }, { status: 500 });
  }
}





