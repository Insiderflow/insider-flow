import { beforeEach, describe, expect, it, vi } from 'vitest';

const constructEventMock = vi.fn();
const subscriptionRetrieveMock = vi.fn();

const prismaMock = {
  user: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
};

vi.mock('stripe', () => {
  class StripeMock {
    webhooks = {
      constructEvent: constructEventMock,
    };

    subscriptions = {
      retrieve: subscriptionRetrieveMock,
    };
  }

  return { default: StripeMock };
});

vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}));

describe('POST /api/stripe/webhook', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
    process.env.STRIPE_SECRET_KEY = 'sk_test';
  });

  it('returns 400 when stripe-signature header is missing', async () => {
    const { POST } = await import('./route');

    const req = new Request('http://localhost/api/stripe/webhook', {
      method: 'POST',
      body: '{}',
    });

    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('Missing signature');
    expect(constructEventMock).not.toHaveBeenCalled();
  });

  it('returns 500 when event processing fails so Stripe retries', async () => {
    const { POST } = await import('./route');

    constructEventMock.mockReturnValue({
      type: 'invoice.payment_succeeded',
      data: {
        object: {
          id: 'in_123',
          subscription: 'sub_123',
        },
      },
    });
    subscriptionRetrieveMock.mockRejectedValue(new Error('Stripe API unavailable'));

    const req = new Request('http://localhost/api/stripe/webhook', {
      method: 'POST',
      body: '{"ok":true}',
      headers: {
        'stripe-signature': 'sig_test',
      },
    });

    const res = await POST(req as never);
    const data = await res.json();

    expect(constructEventMock).toHaveBeenCalled();
    expect(res.status).toBe(500);
    expect(data.error).toBe('Webhook processing failed');
  });
});
