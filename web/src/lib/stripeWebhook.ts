import Stripe from 'stripe';

export function getSubscriptionPeriodEnd(subscription: Stripe.Subscription): Date {
  const periodEnd = (subscription as Stripe.Subscription & { current_period_end?: number }).current_period_end;
  if (!periodEnd) {
    throw new Error(`Missing current_period_end for subscription ${subscription.id}`);
  }
  return new Date(periodEnd * 1000);
}

export function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const invoiceSubscription = (invoice as Stripe.Invoice & { subscription?: string | Stripe.Subscription | null }).subscription;
  if (!invoiceSubscription) return null;
  return typeof invoiceSubscription === 'string' ? invoiceSubscription : invoiceSubscription.id;
}
