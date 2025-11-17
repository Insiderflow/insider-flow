import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'login required' }, { status: 401 });
    }

    // Get full user data from database including stripe_customer_id
    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true,
        email: true,
        stripe_customer_id: true,
        stripe_subscription_id: true,
        membership_tier: true,
      },
    });

    if (!user) {
      console.error('User not found in database:', sessionUser.id);
      return NextResponse.json({ error: 'user_not_found' }, { status: 404 });
    }

    if (!user.stripe_customer_id) {
      console.error('User has no Stripe customer ID:', user.id);
      return NextResponse.json({ error: 'no_subscription' }, { status: 400 });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY is missing');
      return NextResponse.json({ error: 'payment_config' }, { status: 500 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Verify customer exists in Stripe
    try {
      await stripe.customers.retrieve(user.stripe_customer_id);
    } catch (stripeError) {
      console.error('Stripe customer not found:', user.stripe_customer_id, stripeError);
      return NextResponse.json({ error: 'invalid_customer' }, { status: 400 });
    }

    // Create billing portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${req.nextUrl.origin}/account`,
    });

    console.log('Portal session created for user:', user.id, 'URL:', portalSession.url);
    
    // Return JSON with URL for client-side redirect (more reliable than server redirect)
    return NextResponse.json({ url: portalSession.url });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Portal creation error:', errorMessage);
    if (error instanceof Error && error.stack) {
      console.error('Error stack:', error.stack);
    }
    return NextResponse.json({ error: 'portal_failed', details: errorMessage }, { status: 500 });
  }
}
