import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSessionUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    if (!user.stripe_customer_id) {
      return NextResponse.redirect(new URL('/account?error=no_subscription', req.url));
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' });

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/account`,
    });

    return NextResponse.redirect(portalSession.url);
  } catch (error: any) {
    console.error('Portal creation error:', error);
    return NextResponse.redirect(new URL('/account?error=portal_failed', req.url));
  }
}
