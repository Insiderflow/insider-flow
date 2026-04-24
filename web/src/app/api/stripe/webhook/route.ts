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
        console.log('Session details:', {
          mode: session.mode,
          customer: session.customer,
          subscription: session.subscription,
          metadata: session.metadata,
        });

        // Try to find user by customer ID first
        let user = null;
        let customerId: string | null = null;

        if (session.customer) {
          customerId = typeof session.customer === 'string' ? session.customer : session.customer.id;
          user = await prisma.user.findFirst({
            where: { stripe_customer_id: customerId },
          });
        }

        // Fallback: try to find user by metadata if customer lookup fails
        if (!user && session.metadata?.user_id) {
          console.log('User not found by customer ID, trying metadata user_id:', session.metadata.user_id);
          user = await prisma.user.findUnique({
            where: { id: session.metadata.user_id },
          });
          
          // If we found user but they don't have customer_id, update it
          if (user && customerId) {
            await prisma.user.update({
              where: { id: user.id },
              data: { stripe_customer_id: customerId },
            });
            console.log(`✅ Updated user ${user.id} with customer ID ${customerId}`);
          }
        }

        if (!user) {
          console.error(`❌ User not found for customer ${customerId || 'unknown'} or metadata ${session.metadata?.user_id || 'none'}`);
          // Don't return error - let other webhooks handle it
          break;
        }

        // Handle subscription mode
        if (session.mode === 'subscription' && session.subscription) {
          const subscriptionId = typeof session.subscription === 'string' 
            ? session.subscription 
            : session.subscription.id;

          try {
            // Get subscription details to determine period
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            
            // Calculate expiration date from subscription period end
            // Access property with type assertion as Stripe types may not be fully accurate
            const currentPeriodEnd = new Date((subscription as any).current_period_end * 1000);

            await prisma.user.update({
              where: { id: user.id },
              data: {
                membership_tier: 'PAID',
                membership_expires_at: currentPeriodEnd,
                stripe_subscription_id: subscriptionId,
              },
            });
            console.log(`✅ Updated membership for user ${user.id} to PAID, expires ${currentPeriodEnd.toISOString()}`);
          } catch (subError) {
            console.error(`❌ Error retrieving subscription ${subscriptionId}:`, subError);
            // Still update to PAID but without expiration date
            await prisma.user.update({
              where: { id: user.id },
              data: {
                membership_tier: 'PAID',
                stripe_subscription_id: subscriptionId,
              },
            });
            console.log(`✅ Updated membership for user ${user.id} to PAID (without expiration date)`);
          }
        } else if (session.mode === 'payment') {
          // One-time payment - set to PAID for 1 year (or based on price)
          const oneYearFromNow = new Date();
          oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
          
          await prisma.user.update({
            where: { id: user.id },
            data: {
              membership_tier: 'PAID',
              membership_expires_at: oneYearFromNow,
            },
          });
          console.log(`✅ Updated membership for user ${user.id} to PAID (one-time payment), expires ${oneYearFromNow.toISOString()}`);
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
          
          // Access property with type assertion as Stripe types may not be fully accurate
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

        // Access subscription property with type assertion
        const invoiceSubscription = (invoice as any).subscription;
        if (invoiceSubscription) {
          const subscriptionId = typeof invoiceSubscription === 'string' 
            ? invoiceSubscription 
            : invoiceSubscription.id;
          
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
    // Log full error details for debugging
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
      console.error('Error message:', error.message);
    }
    // Return non-2xx so Stripe retries transient failures.
    return NextResponse.json(
      { error: 'Webhook processing failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    ok: true, 
    message: 'Stripe webhook endpoint is active',
    webhook_secret_configured: !!process.env.STRIPE_WEBHOOK_SECRET,
    stripe_key_configured: !!process.env.STRIPE_SECRET_KEY
  });
}


