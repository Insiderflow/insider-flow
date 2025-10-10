import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

export const config = { api: { bodyParser: false } };

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET!;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-09-30.clover' });
  const payload = await req.text();
  const sig = req.headers.get('stripe-signature') as string;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, sig, secret);
  } catch (err: any) {
    console.error('Webhook signature verification failed.', err.message);
    return NextResponse.json({ error: 'invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        // Find user by customer id, or fall back to email when customer mapping isn't set yet
        let user = await prisma.user.findFirst({ where: { stripe_customer_id: customerId } });
        if (!user) {
          const email = (session.customer_details?.email || session.customer_email || undefined)?.toLowerCase();
          if (email) {
            user = await prisma.user.findFirst({ where: { email } });
          }
        }

        if (user) {
          // Ensure we persist the Stripe customer/subscription IDs and set membership
          const sub = subscriptionId ? await stripe.subscriptions.retrieve(subscriptionId) : null;
          await prisma.user.update({
            where: { id: user.id },
            data: {
              stripe_customer_id: user.stripe_customer_id || customerId || undefined,
              stripe_subscription_id: subscriptionId || undefined,
              membership_tier: 'PAID',
              membership_expires_at: sub?.data?.current_period_end ? new Date(sub.data.current_period_end * 1000) : null,
            },
          });
        }
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const status = sub.status;
        const user = await prisma.user.findFirst({ where: { stripe_customer_id: customerId } });
        if (user) {
          const isActive = status === 'active' || status === 'trialing' || status === 'past_due';
          await prisma.user.update({
            where: { id: user.id },
            data: {
              membership_tier: isActive ? 'PAID' : 'FREE',
              membership_expires_at: sub.current_period_end ? new Date(sub.current_period_end * 1000) : null,
              stripe_subscription_id: sub.id,
            },
          });
        }
        break;
      }
    }
  } catch (e: any) {
    console.error('Webhook handler error', e);
    return NextResponse.json({ error: 'handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}



