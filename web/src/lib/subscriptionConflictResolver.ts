import { prisma } from '@/lib/prisma';
import {
  isPaidSubscriptionStatus,
  normalizeStoredSubscriptionStatus,
  NormalizedSubscriptionStatus,
} from '@/lib/subscriptionStateMachine';

type Provider = 'stripe' | 'apple' | 'google' | 'unknown';

type IncomingSubscriptionSnapshot = {
  provider: Provider;
  subscriptionStatus: NormalizedSubscriptionStatus;
  membershipExpiresAt: Date | null;
  entitlementId: string | null;
  stripeSubscriptionId?: string | null;
};

type ResolveContext = {
  source?: string;
  eventKey?: string | null;
  eventType?: string | null;
};

const PROVIDER_PRIORITY: Record<string, number> = {
  apple: 3,
  google: 3,
  stripe: 2,
  unknown: 1,
};

function toExpiryScore(date: Date | null) {
  return date ? date.getTime() : -1;
}

function shouldApplyIncomingSnapshot({
  currentProvider,
  currentStatus,
  currentExpiresAt,
  incoming,
}: {
  currentProvider: string | null;
  currentStatus: NormalizedSubscriptionStatus;
  currentExpiresAt: Date | null;
  incoming: IncomingSubscriptionSnapshot;
}) {
  const incomingPaid = isPaidSubscriptionStatus(incoming.subscriptionStatus);
  const currentPaid = isPaidSubscriptionStatus(currentStatus);

  if (incomingPaid && !currentPaid) return { apply: true, reason: 'incoming_paid_current_unpaid' };
  if (!incomingPaid && currentPaid) {
    const sameProvider = (currentProvider || '').toLowerCase() === incoming.provider;
    return {
      apply: sameProvider,
      reason: sameProvider ? 'same_provider_downgrade' : 'blocked_cross_provider_downgrade',
    };
  }

  if (incomingPaid && currentPaid) {
    const incomingScore = toExpiryScore(incoming.membershipExpiresAt);
    const currentScore = toExpiryScore(currentExpiresAt);
    if (incomingScore > currentScore) return { apply: true, reason: 'incoming_later_expiry' };
    if (incomingScore < currentScore) return { apply: false, reason: 'current_later_expiry' };

    const incomingPriority = PROVIDER_PRIORITY[incoming.provider] ?? PROVIDER_PRIORITY.unknown;
    const currentPriority = PROVIDER_PRIORITY[(currentProvider || 'unknown').toLowerCase()] ?? PROVIDER_PRIORITY.unknown;
    if (incomingPriority > currentPriority) return { apply: true, reason: 'incoming_higher_provider_priority' };
    if (incomingPriority < currentPriority) return { apply: false, reason: 'current_higher_provider_priority' };

    return { apply: (currentProvider || '').toLowerCase() === incoming.provider, reason: 'equal_priority_stable_provider' };
  }

  if (!currentProvider) return { apply: true, reason: 'current_provider_empty' };
  if ((currentProvider || '').toLowerCase() === incoming.provider) return { apply: true, reason: 'same_provider_unpaid_update' };

  const incomingPriority = PROVIDER_PRIORITY[incoming.provider] ?? PROVIDER_PRIORITY.unknown;
  const currentPriority = PROVIDER_PRIORITY[(currentProvider || 'unknown').toLowerCase()] ?? PROVIDER_PRIORITY.unknown;
  return {
    apply: incomingPriority > currentPriority,
    reason: incomingPriority > currentPriority
      ? 'incoming_higher_provider_priority_unpaid'
      : 'current_higher_provider_priority_unpaid',
  };
}

export async function resolveAndPersistSubscriptionSnapshot(
  userId: string,
  incoming: IncomingSubscriptionSnapshot,
  context: ResolveContext = {},
) {
  const current = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      membership_tier: true,
      membership_expires_at: true,
      subscription_status: true,
      billing_provider: true,
      subscription_entitlement_id: true,
      subscription_last_synced_at: true,
      stripe_subscription_id: true,
    },
  });
  if (!current) {
    throw new Error(`User not found: ${userId}`);
  }

  const currentStatus = normalizeStoredSubscriptionStatus(
    current.subscription_status,
    current.membership_tier,
  );
  const currentIsPaid = isPaidSubscriptionStatus(currentStatus);
  const decision = shouldApplyIncomingSnapshot({
    currentProvider: current.billing_provider,
    currentStatus,
    currentExpiresAt: current.membership_expires_at,
    incoming,
  });

  if (!decision.apply) {
    const blockedSnapshot = {
      membershipTier: currentIsPaid ? 'PAID' : 'FREE',
      subscriptionStatus: currentStatus,
      membershipExpiresAt: current.membership_expires_at,
      billingProvider: current.billing_provider,
      activeEntitlementId: current.subscription_entitlement_id,
    };
    await writeSubscriptionTransitionAudit({
      userId,
      decisionReason: decision.reason,
      applied: false,
      source: context.source || 'system',
      eventKey: context.eventKey || null,
      eventType: context.eventType || null,
      previous: {
        membershipTier: current.membership_tier,
        subscriptionStatus: currentStatus,
        billingProvider: current.billing_provider,
        membershipExpiresAt: current.membership_expires_at,
        entitlementId: current.subscription_entitlement_id,
      },
      incoming,
      resulting: blockedSnapshot,
    });
    return {
      applied: false,
      reason: decision.reason,
      snapshot: {
        isPaid: currentIsPaid,
        subscriptionStatus: blockedSnapshot.subscriptionStatus,
        membershipExpiresAt: blockedSnapshot.membershipExpiresAt,
        billingProvider: blockedSnapshot.billingProvider,
        activeEntitlementId: blockedSnapshot.activeEntitlementId,
      },
    };
  }

  const incomingPaid = isPaidSubscriptionStatus(incoming.subscriptionStatus);
  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      membership_tier: incomingPaid ? 'PAID' : 'FREE',
      membership_expires_at: incomingPaid ? incoming.membershipExpiresAt : null,
      subscription_status: incoming.subscriptionStatus,
      billing_provider: incoming.provider === 'unknown' ? null : incoming.provider,
      subscription_entitlement_id: incoming.entitlementId,
      subscription_last_synced_at: new Date(),
      ...(incoming.provider === 'stripe' && incoming.stripeSubscriptionId !== undefined
        ? { stripe_subscription_id: incoming.stripeSubscriptionId }
        : {}),
    },
    select: {
      membership_expires_at: true,
      subscription_status: true,
      billing_provider: true,
      subscription_entitlement_id: true,
    },
  });

  const updatedStatus = normalizeStoredSubscriptionStatus(updated.subscription_status, incomingPaid ? 'PAID' : 'FREE');
  await writeSubscriptionTransitionAudit({
    userId,
    decisionReason: decision.reason,
    applied: true,
    source: context.source || 'system',
    eventKey: context.eventKey || null,
    eventType: context.eventType || null,
    previous: {
      membershipTier: current.membership_tier,
      subscriptionStatus: currentStatus,
      billingProvider: current.billing_provider,
      membershipExpiresAt: current.membership_expires_at,
      entitlementId: current.subscription_entitlement_id,
    },
    incoming,
    resulting: {
      membershipTier: incomingPaid ? 'PAID' : 'FREE',
      subscriptionStatus: updatedStatus,
      billingProvider: updated.billing_provider,
      membershipExpiresAt: updated.membership_expires_at,
      activeEntitlementId: updated.subscription_entitlement_id,
    },
  });
  return {
    applied: true,
    reason: decision.reason,
    snapshot: {
      isPaid: incomingPaid,
      subscriptionStatus: updatedStatus,
      membershipExpiresAt: updated.membership_expires_at,
      billingProvider: updated.billing_provider,
      activeEntitlementId: updated.subscription_entitlement_id,
    },
  };
}

async function writeSubscriptionTransitionAudit({
  userId,
  source,
  eventKey,
  eventType,
  decisionReason,
  applied,
  previous,
  incoming,
  resulting,
}: {
  userId: string;
  source: string;
  eventKey: string | null;
  eventType: string | null;
  decisionReason: string;
  applied: boolean;
  previous: {
    membershipTier: string | null;
    subscriptionStatus: string | null;
    billingProvider: string | null;
    membershipExpiresAt: Date | null;
    entitlementId: string | null;
  };
  incoming: IncomingSubscriptionSnapshot;
  resulting: {
    membershipTier: string | null;
    subscriptionStatus: string | null;
    billingProvider: string | null;
    membershipExpiresAt: Date | null;
    activeEntitlementId: string | null;
  };
}) {
  try {
    await prisma.subscriptionTransitionAudit.create({
      data: {
        user_id: userId,
        source: source || 'system',
        event_key: eventKey,
        event_type: eventType,
        decision_reason: decisionReason,
        applied,
        previous_membership_tier: previous.membershipTier,
        previous_subscription_status: previous.subscriptionStatus,
        previous_billing_provider: previous.billingProvider,
        previous_expires_at: previous.membershipExpiresAt,
        previous_entitlement_id: previous.entitlementId,
        incoming_provider: incoming.provider,
        incoming_subscription_status: incoming.subscriptionStatus,
        incoming_expires_at: incoming.membershipExpiresAt,
        incoming_entitlement_id: incoming.entitlementId,
        resulting_membership_tier: resulting.membershipTier,
        resulting_subscription_status: resulting.subscriptionStatus,
        resulting_billing_provider: resulting.billingProvider,
        resulting_expires_at: resulting.membershipExpiresAt,
        resulting_entitlement_id: resulting.activeEntitlementId,
      },
    });
  } catch (error) {
    console.error('subscription transition audit write failed', error);
  }
}
