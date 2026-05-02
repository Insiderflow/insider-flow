import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { processStripeWebhookEvent } from '@/lib/stripeWebhookProcessor';
import {
  beginSubscriptionEventProcessing,
  markSubscriptionEventFailed,
  markSubscriptionEventProcessed,
} from '@/lib/subscriptionEvents';
import { enforceRouteRateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const rate = enforceRouteRateLimit(req, 'stripe_webhook', 120, 60_000);
  if (!rate.ok) {
    return NextResponse.json(
      { error: 'Too many requests', retry_after_seconds: rate.retryAfterSeconds },
      { status: 429 },
    );
  }

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

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('STRIPE_SECRET_KEY is not set');
    return NextResponse.json({ error: 'Stripe secret key not configured' }, { status: 500 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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

  const eventProcessing = await beginSubscriptionEventProcessing({
    provider: 'stripe',
    eventKey: event.id,
    eventType: event.type,
    payload: event,
  });

  if (eventProcessing.duplicate) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    await processStripeWebhookEvent(event, stripe);

    if (eventProcessing.id) {
      await markSubscriptionEventProcessed(eventProcessing.id);
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    if (eventProcessing.id) {
      await markSubscriptionEventFailed(
        eventProcessing.id,
        error instanceof Error ? error.message : String(error),
      );
    }
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


