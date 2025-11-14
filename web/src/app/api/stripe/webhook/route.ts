import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    console.error('Missing stripe-signature header');
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET is not set');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    const error = err as Error;
    console.error('Webhook signature verification failed:', error.message);
    return NextResponse.json({ error: `Webhook Error: ${error.message}` }, { status: 400 });
  }

  console.log(`Received Stripe event: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Processing checkout.session.completed:', session.id);

        if (session.mode === 'subscription' && session.customer && session.subscription) {
          const customerId = typeof session.customer === 'string' ? session.customer : session.customer.id;
          const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id;

          // Get subscription details to determine period
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          
          // Calculate expiration date from subscription period end
          // Access property directly as the Stripe SDK returns the correct object
          const currentPeriodEnd = new Date((subscription as any).current_period_end * 1000);

          // Find user by Stripe customer ID
          const user = await prisma.user.findFirst({
            where: { stripe_customer_id: customerId },
          });

          if (user) {
            await prisma.user.update({
              where: { id: user.id },
              data: {
                membership_tier: 'PAID',
                membership_expires_at: currentPeriodEnd,
                stripe_subscription_id: subscriptionId,
              },
            });
            console.log(`✅ Updated membership for user ${user.id} to PAID, expires ${currentPeriodEnd.toISOString()}`);
          } else {
            console.error(`❌ User not found for customer ${customerId}`);
          }
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`Processing ${event.type}:`, subscription.id);

        if (subscription.status === 'active' || subscription.status === 'trialing') {
          const customerId = typeof subscription.customer === 'string' 
            ? subscription.customer 
            : subscription.customer.id;
          
          const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

          const user = await prisma.user.findFirst({
            where: { stripe_customer_id: customerId },
          });

          if (user) {
            await prisma.user.update({
              where: { id: user.id },
              data: {
                membership_tier: 'PAID',
                membership_expires_at: currentPeriodEnd,
                stripe_subscription_id: subscription.id,
              },
            });
            console.log(`✅ Updated membership for user ${user.id} to PAID, expires ${currentPeriodEnd.toISOString()}`);
          } else {
            console.error(`❌ User not found for customer ${customerId}`);
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Processing customer.subscription.deleted:', subscription.id);

        const customerId = typeof subscription.customer === 'string' 
          ? subscription.customer 
          : subscription.customer.id;

        const user = await prisma.user.findFirst({
          where: { stripe_customer_id: customerId },
        });

        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              membership_tier: 'FREE',
              membership_expires_at: null,
              stripe_subscription_id: null,
            },
          });
          console.log(`✅ Downgraded user ${user.id} to FREE`);
        } else {
          console.error(`❌ User not found for customer ${customerId}`);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Processing invoice.payment_succeeded:', invoice.id);

        if (invoice.subscription) {
          const subscriptionId = typeof invoice.subscription === 'string' 
            ? invoice.subscription 
            : invoice.subscription.id;
          
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          // Access properties directly as the Stripe SDK returns the correct object
          const customerId = typeof (subscription as any).customer === 'string' 
            ? (subscription as any).customer 
            : (subscription as any).customer.id;
          
          const currentPeriodEnd = new Date((subscription as any).current_period_end * 1000);

          const user = await prisma.user.findFirst({
            where: { stripe_customer_id: customerId },
          });

          if (user) {
            await prisma.user.update({
              where: { id: user.id },
              data: {
                membership_tier: 'PAID',
                membership_expires_at: currentPeriodEnd,
              },
            });
            console.log(`✅ Renewed membership for user ${user.id}, expires ${currentPeriodEnd.toISOString()}`);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, message: 'Stripe webhook endpoint is active' });
}


