import { describe, expect, it } from 'vitest';
import type Stripe from 'stripe';
import { getInvoiceSubscriptionId, getSubscriptionPeriodEnd } from './stripeWebhook';

describe('stripeWebhook helpers', () => {
  it('returns Date from current_period_end', () => {
    const subscription = {
      id: 'sub_123',
      current_period_end: 1735689600, // 2025-01-01T00:00:00.000Z
    } as unknown as Stripe.Subscription;

    const result = getSubscriptionPeriodEnd(subscription);
    expect(result.toISOString()).toBe('2025-01-01T00:00:00.000Z');
  });

  it('throws when current_period_end is missing', () => {
    const subscription = { id: 'sub_missing' } as Stripe.Subscription;
    expect(() => getSubscriptionPeriodEnd(subscription)).toThrow(
      'Missing current_period_end for subscription sub_missing',
    );
  });

  it('extracts subscription id from string invoice field', () => {
    const invoice = { subscription: 'sub_abc' } as Stripe.Invoice;
    expect(getInvoiceSubscriptionId(invoice)).toBe('sub_abc');
  });

  it('extracts subscription id from expanded subscription object', () => {
    const invoice = { subscription: { id: 'sub_xyz' } } as unknown as Stripe.Invoice;
    expect(getInvoiceSubscriptionId(invoice)).toBe('sub_xyz');
  });

  it('returns null when invoice has no subscription', () => {
    const invoice = {} as Stripe.Invoice;
    expect(getInvoiceSubscriptionId(invoice)).toBeNull();
  });
});
