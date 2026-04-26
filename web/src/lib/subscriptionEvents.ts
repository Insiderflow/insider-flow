import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

const MAX_SUBSCRIPTION_EVENT_RETRIES = Number(process.env.SUBSCRIPTION_EVENT_MAX_RETRIES || 6);

type BeginEventParams = {
  provider: 'stripe' | 'revenuecat';
  eventKey: string;
  eventType: string;
  payload?: unknown;
};

export async function beginSubscriptionEventProcessing(params: BeginEventParams) {
  try {
    const created = await prisma.subscriptionEvent.create({
      data: {
        provider: params.provider,
        event_key: params.eventKey,
        event_type: params.eventType,
        status: 'processing',
        retry_count: 0,
        next_retry_at: null,
        payload: params.payload === undefined
          ? Prisma.JsonNull
          : (params.payload as Prisma.InputJsonValue),
      },
      select: { id: true },
    });
    return { duplicate: false, id: created.id };
  } catch (error) {
    if ((error as { code?: string })?.code === 'P2002') {
      return { duplicate: true, id: null };
    }
    throw error;
  }
}

export async function markSubscriptionEventProcessed(eventId: string) {
  await prisma.subscriptionEvent.update({
    where: { id: eventId },
    data: {
      status: 'processed',
      processed_at: new Date(),
      next_retry_at: null,
      error: null,
    },
  });
}

export async function markSubscriptionEventFailed(eventId: string, errorMessage: string) {
  const current = await prisma.subscriptionEvent.findUnique({
    where: { id: eventId },
    select: { retry_count: true },
  });
  const nextRetryCount = (current?.retry_count ?? 0) + 1;
  const shouldDeadLetter = nextRetryCount >= Math.max(1, MAX_SUBSCRIPTION_EVENT_RETRIES);
  const delayMinutes = Math.min(5 * Math.pow(2, Math.max(0, nextRetryCount - 1)), 12 * 60);
  const nextRetryAt = new Date(Date.now() + delayMinutes * 60 * 1000);

  await prisma.subscriptionEvent.update({
    where: { id: eventId },
    data: {
      status: shouldDeadLetter ? 'dead_lettered' : 'failed',
      retry_count: nextRetryCount,
      next_retry_at: shouldDeadLetter ? null : nextRetryAt,
      error: errorMessage.slice(0, 2000),
    },
  });
}
