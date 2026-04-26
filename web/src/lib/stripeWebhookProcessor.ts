import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { getInvoiceSubscriptionId, getSubscriptionPeriodEnd } from '@/lib/stripeWebhook';
import { deriveStripeSubscriptionStatus } from '@/lib/subscriptionStateMachine';
import { resolveAndPersistSubscriptionSnapshot } from '@/lib/subscriptionConflictResolver';

async function persistStripeSnapshot(
  userId: string,
  source: string,
  event: { eventKey?: string | null; eventType?: string | null },
  {
    subscriptionStatus,
    membershipExpiresAt,
    stripeSubscriptionId,
  }: {
    subscriptionStatus: ReturnType<typeof deriveStripeSubscriptionStatus>['subscriptionStatus'];
    membershipExpiresAt: Date | null;
    stripeSubscriptionId?: string | null;
  },
) {
  await resolveAndPersistSubscriptionSnapshot(userId, {
    provider: 'stripe',
    subscriptionStatus,
    membershipExpiresAt,
    entitlementId: null,
    stripeSubscriptionId,
  }, {
    source,
    eventKey: event.eventKey || null,
    eventType: event.eventType || null,
  });
}

export async function processStripeWebhookEvent(event: Stripe.Event, stripe: Stripe) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      let user = null;
      let customerId: string | null = null;

      if (session.customer) {
        customerId = typeof session.customer === 'string' ? session.customer : session.customer.id;
        user = await prisma.user.findFirst({
          where: { stripe_customer_id: customerId },
        });
      }

      if (!user && session.metadata?.user_id) {
        user = await prisma.user.findUnique({
          where: { id: session.metadata.user_id },
        });

        if (user && customerId) {
          await prisma.user.update({
            where: { id: user.id },
            data: { stripe_customer_id: customerId },
          });
        }
      }

      if (!user) {
        return;
      }

      if (session.mode === 'subscription' && session.subscription) {
        const subscriptionId = typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription.id;

        try {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const currentPeriodEnd = getSubscriptionPeriodEnd(subscription);
          const derived = deriveStripeSubscriptionStatus({
            stripeStatus: subscription.status,
            currentPeriodEnd,
          });

          await persistStripeSnapshot(user.id, 'stripe_webhook', { eventKey: event.id, eventType: event.type }, {
            subscriptionStatus: derived.subscriptionStatus,
            membershipExpiresAt: derived.membershipExpiresAt,
            stripeSubscriptionId: subscriptionId,
          });
        } catch {
          const derived = deriveStripeSubscriptionStatus({
            stripeStatus: 'active',
            currentPeriodEnd: null,
          });
          await persistStripeSnapshot(user.id, 'stripe_webhook', { eventKey: event.id, eventType: event.type }, {
            subscriptionStatus: derived.subscriptionStatus,
            membershipExpiresAt: derived.membershipExpiresAt,
            stripeSubscriptionId: subscriptionId,
          });
        }
      } else if (session.mode === 'payment') {
        const oneYearFromNow = new Date();
        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
        const derived = deriveStripeSubscriptionStatus({
          stripeStatus: 'active',
          currentPeriodEnd: oneYearFromNow,
        });

        await persistStripeSnapshot(user.id, 'stripe_webhook', { eventKey: event.id, eventType: event.type }, {
          subscriptionStatus: derived.subscriptionStatus,
          membershipExpiresAt: derived.membershipExpiresAt,
        });
      }
      return;
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      if (subscription.status !== 'active' && subscription.status !== 'trialing') {
        return;
      }

      const customerId = typeof subscription.customer === 'string'
        ? subscription.customer
        : subscription.customer.id;
      const currentPeriodEnd = getSubscriptionPeriodEnd(subscription);
      const derived = deriveStripeSubscriptionStatus({
        stripeStatus: subscription.status,
        currentPeriodEnd,
      });

      const user = await prisma.user.findFirst({
        where: { stripe_customer_id: customerId },
      });

      if (!user) return;

      await persistStripeSnapshot(user.id, 'stripe_webhook', { eventKey: event.id, eventType: event.type }, {
        subscriptionStatus: derived.subscriptionStatus,
        membershipExpiresAt: derived.membershipExpiresAt,
        stripeSubscriptionId: subscription.id,
      });
      return;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = typeof subscription.customer === 'string'
        ? subscription.customer
        : subscription.customer.id;
      let currentPeriodEnd: Date | null = null;
      try {
        currentPeriodEnd = getSubscriptionPeriodEnd(subscription);
      } catch {
        currentPeriodEnd = null;
      }
      const derived = deriveStripeSubscriptionStatus({
        stripeStatus: subscription.status || 'canceled',
        currentPeriodEnd,
      });

      const user = await prisma.user.findFirst({
        where: { stripe_customer_id: customerId },
      });

      if (!user) return;

      await persistStripeSnapshot(user.id, 'stripe_webhook', { eventKey: event.id, eventType: event.type }, {
        subscriptionStatus: derived.subscriptionStatus,
        membershipExpiresAt: derived.membershipExpiresAt,
        stripeSubscriptionId: derived.isPaid ? subscription.id : null,
      });
      return;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = getInvoiceSubscriptionId(invoice);
      if (!subscriptionId) return;

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const customerId = typeof subscription.customer === 'string'
        ? subscription.customer
        : subscription.customer.id;
      const currentPeriodEnd = getSubscriptionPeriodEnd(subscription);
      const derived = deriveStripeSubscriptionStatus({
        stripeStatus: subscription.status,
        currentPeriodEnd,
      });

      const user = await prisma.user.findFirst({
        where: { stripe_customer_id: customerId },
      });

      if (!user) return;

      await persistStripeSnapshot(user.id, 'stripe_webhook', { eventKey: event.id, eventType: event.type }, {
        subscriptionStatus: derived.subscriptionStatus,
        membershipExpiresAt: derived.membershipExpiresAt,
      });
      return;
    }

    default:
      return;
  }
}
