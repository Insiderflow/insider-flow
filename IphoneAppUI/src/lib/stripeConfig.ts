/**
 * Checkout uses server `STRIPE_PRICE_MONTHLY` via `plan: "monthly"` — no client price ID.
 * @deprecated only for docs / optional overrides; do not hardcode live price IDs here.
 */
export function getStripePriceId(): string {
  return import.meta.env.VITE_STRIPE_PRICE_ID?.trim() ?? "";
}
