export type BillingPlan = 'monthly' | 'yearly';

function monthlyPriceId(): string | undefined {
  return (
    process.env.STRIPE_PRICE_MONTHLY?.trim() ||
    process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY?.trim() ||
    undefined
  );
}

function yearlyPriceId(): string | undefined {
  return (
    process.env.STRIPE_PRICE_YEARLY?.trim() ||
    process.env.NEXT_PUBLIC_STRIPE_PRICE_YEARLY?.trim() ||
    undefined
  );
}

/** Allowed checkout prices — must match the Stripe account behind STRIPE_SECRET_KEY. */
export function allowedStripePriceIds(): string[] {
  return [monthlyPriceId(), yearlyPriceId()].filter((id): id is string => Boolean(id));
}

/**
 * Resolve price for checkout. Prefer `plan` (server env) so clients cannot send
 * production live price IDs while the API uses a test secret key (or vice versa).
 */
export function resolveCheckoutPriceId(input: {
  priceId?: string;
  plan?: BillingPlan;
}): string | null {
  const monthly = monthlyPriceId();
  const yearly = yearlyPriceId();
  const allowed = new Set(allowedStripePriceIds());

  if (input.plan === 'monthly' && monthly) return monthly;
  if (input.plan === 'yearly' && yearly) return yearly;

  const priceId = input.priceId?.trim();
  if (priceId) {
    if (allowed.size === 0 || allowed.has(priceId)) return priceId;
    // Client sent a foreign price (e.g. live ID + test key) — fall back to monthly
    return monthly ?? null;
  }

  return monthly ?? null;
}
