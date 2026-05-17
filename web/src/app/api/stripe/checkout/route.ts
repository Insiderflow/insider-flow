import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { resolveCheckoutPriceId, type BillingPlan } from '@/lib/stripePrices';

export async function POST(req: NextRequest) {
  try {
    console.log('Checkout request received');
    const user = await getSessionUser(req);
    if (!user) {
      console.error('No user found');
      return NextResponse.json({ error: '請先登入' }, { status: 401 });
    }


    const body = await req.json();
    const requestedPlan =
      body?.plan === 'yearly' || body?.plan === 'monthly' ? (body.plan as BillingPlan) : undefined;
    const plan: BillingPlan | undefined = requestedPlan;
    const priceId = resolveCheckoutPriceId({
      plan,
      priceId: typeof body?.priceId === 'string' ? body.priceId : undefined,
    });
    const returnUrl =
      typeof body?.return_url === 'string' && body.return_url.startsWith('http')
        ? body.return_url
        : null;

    if (!priceId) {
      return NextResponse.json({ error: 'payment_config' }, { status: 500 });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY is missing');
      return NextResponse.json({ error: 'payment_config' }, { status: 500 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Get or create Stripe customer
    let customerId = user.stripe_customer_id;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id,
        },
      });
      customerId = customer.id;
      
      // Save customer ID to database
      await prisma.user.update({
        where: { id: user.id },
        data: { stripe_customer_id: customerId },
      });
      console.log(`Created Stripe customer ${customerId} for user ${user.id}`);
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      allow_promotion_codes: true,
      success_url: returnUrl
        ? `${returnUrl}${returnUrl.includes('?') ? '&' : '?'}success=true`
        : `${req.nextUrl.origin}/account?success=true`,
      cancel_url: returnUrl
        ? `${returnUrl}${returnUrl.includes('?') ? '&' : '?'}canceled=true`
        : `${req.nextUrl.origin}/upgrade?canceled=true`,
      metadata: {
        user_id: user.id,
      },
    });

    console.log(`Checkout session created: ${session.id} for user ${user.id}`);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    const message = error instanceof Error ? error.message : 'Checkout failed';
    return NextResponse.json(
      { error: 'checkout_failed', details: message },
      { status: 500 }
    );
  }
}
