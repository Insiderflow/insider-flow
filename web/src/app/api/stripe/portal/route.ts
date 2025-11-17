import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.redirect(new URL('/login', req.url));
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
      return NextResponse.redirect(new URL('/account?error=user_not_found', req.url));
    }

    if (!user.stripe_customer_id) {
      console.error('User has no Stripe customer ID:', user.id);
      return NextResponse.redirect(new URL('/account?error=no_subscription', req.url));
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY is missing');
      return NextResponse.redirect(new URL('/account?error=payment_config', req.url));
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Verify customer exists in Stripe
    try {
      await stripe.customers.retrieve(user.stripe_customer_id);
    } catch (stripeError) {
      console.error('Stripe customer not found:', user.stripe_customer_id, stripeError);
      return NextResponse.redirect(new URL('/account?error=invalid_customer', req.url));
    }

    // Create billing portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${req.nextUrl.origin}/account`,
    });

    console.log('Portal session created for user:', user.id, 'URL:', portalSession.url);
    return NextResponse.redirect(portalSession.url);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Portal creation error:', errorMessage);
    if (error instanceof Error && error.stack) {
      console.error('Error stack:', error.stack);
    }
    return NextResponse.redirect(new URL('/account?error=portal_failed', req.url));
  }
}
