import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { processStripeWebhookEvent } from '@/lib/stripeWebhookProcessor';
import { processRevenueCatWebhookPayload } from '@/lib/revenuecatWebhook';
import {
  markSubscriptionEventFailed,
  markSubscriptionEventProcessed,
} from '@/lib/subscriptionEvents';

type ReplayProvider = 'stripe' | 'revenuecat';
type ReplayStatus = 'failed' | 'dead_lettered';

function toProvider(value: string): ReplayProvider | null {
  if (value === 'stripe') return 'stripe';
  if (value === 'revenuecat') return 'revenuecat';
  return null;
}

async function replaySingleEvent(eventId: string) {
  const event = await prisma.subscriptionEvent.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      provider: true,
      event_key: true,
      event_type: true,
      payload: true,
    },
  });

  if (!event) {
    throw new Error(`Subscription event not found: ${eventId}`);
  }

  if (!event.payload) {
    throw new Error(`Subscription event has no payload: ${eventId}`);
  }

  const provider = toProvider(event.provider);
  if (!provider) {
    throw new Error(`Unsupported provider on event ${eventId}: ${event.provider}`);
  }

  try {
    if (provider === 'stripe') {
      if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error('STRIPE_SECRET_KEY is not configured');
      }
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      const stripeEvent = event.payload as unknown as Stripe.Event;
      await processStripeWebhookEvent(stripeEvent, stripe);
    } else {
      await processRevenueCatWebhookPayload(event.payload);
    }
    await markSubscriptionEventProcessed(event.id);
    return { id: event.id, eventKey: event.event_key, provider, status: 'processed' as const };
  } catch (error) {
    await markSubscriptionEventFailed(event.id, error instanceof Error ? error.message : String(error));
    throw error;
  }
}

export async function replaySubscriptionEvents({
  eventId,
  provider,
  limit = 10,
  eligibleOnly = false,
  statuses = ['failed'],
}: {
  eventId?: string;
  provider?: ReplayProvider;
  limit?: number;
  eligibleOnly?: boolean;
  statuses?: ReplayStatus[];
}) {
  if (eventId) {
    const single = await replaySingleEvent(eventId);
    return { replayed: [single], requested: 1 };
  }

  const failedEvents = await prisma.subscriptionEvent.findMany({
    where: {
      status: { in: statuses.length > 0 ? statuses : ['failed'] },
      ...(provider ? { provider } : {}),
      ...(eligibleOnly
        ? {
            OR: [
              { next_retry_at: null },
              { next_retry_at: { lte: new Date() } },
            ],
          }
        : {}),
    },
    orderBy: { next_retry_at: 'asc' },
    take: Math.max(1, Math.min(limit, 50)),
    select: { id: true },
  });

  const replayed: Array<{ id: string; eventKey: string; provider: ReplayProvider; status: 'processed' }> = [];
  const errors: Array<{ id: string; error: string }> = [];

  for (const event of failedEvents) {
    try {
      const processed = await replaySingleEvent(event.id);
      replayed.push(processed);
    } catch (error) {
      errors.push({
        id: event.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return {
    replayed,
    errors,
    requested: failedEvents.length,
    eligibleOnly,
  };
}
