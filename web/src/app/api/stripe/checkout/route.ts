import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    console.log('Checkout request received');
    const user = await getSessionUser();
    if (!user) {
      console.error('No user found');
      return NextResponse.json({ error: 'login required' }, { status: 401 });
    }

    const body = await req.json();
    const { priceId } = body;
    console.log('Price ID received:', priceId);
    
    if (!priceId) {
      console.error('No priceId in request');
      return NextResponse.json({ error: 'priceId required' }, { status: 400 });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY is missing');
      return NextResponse.json({ error: 'Payment configuration error' }, { status: 500 });
    }

    console.log('Initializing Stripe with key:', process.env.STRIPE_SECRET_KEY.substring(0, 12) + '...');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Ensure customer
    console.log('Fetching user from database:', user.id);
    const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { stripe_customer_id: true, email: true } });
    let customerId = dbUser?.stripe_customer_id || null;
    if (!customerId) {
      console.log('Creating new Stripe customer for email:', dbUser?.email);
      const customer = await stripe.customers.create({ email: dbUser?.email || undefined });
      customerId = customer.id;
      await prisma.user.update({ where: { id: user.id }, data: { stripe_customer_id: customerId } });
      console.log('Created customer:', customerId);
    } else {
      console.log('Using existing customer:', customerId);
    }

    // Validate priceId format
    if (!priceId.startsWith('price_')) {
      console.error('Invalid priceId format:', priceId);
      return NextResponse.json({ 
        error: 'Invalid price ID format',
        details: 'Price ID must start with "price_"'
      }, { status: 400 });
    }

    console.log('Creating checkout session with:', { priceId, customerId });
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${req.nextUrl.origin}/account?status=success`,
      cancel_url: `${req.nextUrl.origin}/upgrade?status=cancel`,
      allow_promotion_codes: true,
      payment_method_types: ['card'],
    });

    console.log('Checkout session created:', session.id);
    return NextResponse.json({ url: session.url });
  } catch (e: unknown) {
    let errorMessage = 'Unknown error';
    let errorCode: string | undefined;
    let errorType: string | undefined;
    let statusCode = 500;
    
    // Handle Stripe errors specifically
    if (e && typeof e === 'object' && 'type' in e) {
      const stripeError = e as { type?: string; message?: string; code?: string };
      errorMessage = stripeError.message || String(e);
      errorCode = stripeError.code;
      errorType = stripeError.type;
      
      // Map Stripe error types to appropriate status codes
      if (stripeError.type === 'StripeCardError') {
        statusCode = 402; // Payment required
      } else if (stripeError.type === 'StripeInvalidRequestError') {
        statusCode = 400; // Bad request
      } else if (stripeError.type === 'StripeAPIError') {
        statusCode = 502; // Bad gateway
      } else if (stripeError.type === 'StripeAuthenticationError') {
        statusCode = 401; // Unauthorized
      }
    } else if (e instanceof Error) {
      errorMessage = e.message;
      errorCode = undefined;
      errorType = undefined;
    } else {
      errorMessage = String(e);
    }
    
    console.error('checkout error:', {
      message: errorMessage,
      code: errorCode,
      type: errorType,
      error: e
    });
    
    // Return error details - make sure to handle serialization
    try {
      return NextResponse.json({ 
        error: 'checkout failed', 
        details: errorMessage,
        code: errorCode || null,
        type: errorType || null
      }, { status: statusCode });
    } catch (jsonError) {
      // Fallback if JSON serialization fails
      console.error('Failed to serialize error response:', jsonError);
      return NextResponse.json({ 
        error: 'checkout failed',
        details: String(errorMessage)
      }, { status: 500 });
    }
  }
}





