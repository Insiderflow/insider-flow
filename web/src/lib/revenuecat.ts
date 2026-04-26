import { resolveAndPersistSubscriptionSnapshot } from '@/lib/subscriptionConflictResolver';
import {
  isPaidSubscriptionStatus,
  NormalizedSubscriptionStatus,
} from '@/lib/subscriptionStateMachine';

type RevenueCatSubscriber = {
  entitlements?: Record<string, { expires_date?: string | null }>;
  subscriptions?: Record<
    string,
    {
      expires_date?: string | null;
      store?: string | null;
      period_type?: string | null;
      unsubscribe_detected_at?: string | null;
      billing_issues_detected_at?: string | null;
    }
  >;
};

type RevenueCatSubscriberResponse = {
  subscriber?: RevenueCatSubscriber;
};

function getRevenueCatSecretKey() {
  const key = process.env.REVENUECAT_SECRET_API_KEY;
  if (!key) {
    throw new Error('REVENUECAT_SECRET_API_KEY is not configured');
  }
  return key;
}

function normalizeBillingProvider(store?: string | null): 'apple' | 'google' | 'stripe' | null {
  if (!store) return null;
  const normalized = store.toUpperCase();
  if (normalized.includes('APP_STORE')) return 'apple';
  if (normalized.includes('PLAY_STORE')) return 'google';
  if (normalized.includes('STRIPE')) return 'stripe';
  return null;
}

function parseIsoDate(input?: string | null): Date | null {
  if (!input) return null;
  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function isActiveAtNow(expiresAt: Date | null) {
  if (!expiresAt) return true;
  return expiresAt.getTime() > Date.now();
}

function extractSubscriptionState(subscriber?: RevenueCatSubscriber) {
  const entitlements = subscriber?.entitlements || {};
  const subscriptions = subscriber?.subscriptions || {};
  const entitlementId = process.env.REVENUECAT_ENTITLEMENT_ID || '';

  const entitlementEntries = Object.entries(entitlements);
  const filteredEntitlements = entitlementId
    ? entitlementEntries.filter(([id]) => id === entitlementId)
    : entitlementEntries;

  const activeEntitlements = filteredEntitlements.filter(([, value]) =>
    isActiveAtNow(parseIsoDate(value?.expires_date)),
  );
  const activeEntitlementExpirations = activeEntitlements
    .map(([, value]) => parseIsoDate(value?.expires_date));

  const hasActiveEntitlement = activeEntitlementExpirations.length > 0;
  const membershipExpiresAt = activeEntitlementExpirations.reduce<Date | null>((latest, current) => {
    if (!current) return latest;
    if (!latest) return current;
    return current > latest ? current : latest;
  }, null);

  const subscriptionEntries = Object.values(subscriptions).map((subscription) => ({
    ...subscription,
    expiresAt: parseIsoDate(subscription?.expires_date),
  }));
  const activeSubscriptions = subscriptionEntries.filter((subscription) =>
    isActiveAtNow(subscription.expiresAt),
  );
  const latestSubscription =
    activeSubscriptions.sort((a, b) => (b.expiresAt?.getTime() || 0) - (a.expiresAt?.getTime() || 0))[0] ||
    subscriptionEntries.sort((a, b) => (b.expiresAt?.getTime() || 0) - (a.expiresAt?.getTime() || 0))[0] ||
    null;
  const billingProvider = normalizeBillingProvider(latestSubscription?.store);
  const activeEntitlementId = activeEntitlements[0]?.[0] || null;

  let subscriptionStatus: NormalizedSubscriptionStatus = 'free';
  if (hasActiveEntitlement) {
    const hasBillingIssue = activeSubscriptions.some((subscription) => Boolean(subscription.billing_issues_detected_at));
    const isTrialing = activeSubscriptions.some(
      (subscription) => (subscription.period_type || '').toLowerCase() === 'trial',
    );
    if (hasBillingIssue) subscriptionStatus = 'grace_period';
    else if (isTrialing) subscriptionStatus = 'trialing';
    else subscriptionStatus = 'active';
  } else if (subscriptionEntries.some((subscription) => Boolean(subscription.unsubscribe_detected_at))) {
    subscriptionStatus = 'canceled';
  } else if (subscriptionEntries.some((subscription) => Boolean(subscription.expiresAt))) {
    subscriptionStatus = 'expired';
  }
  const isPaid = isPaidSubscriptionStatus(subscriptionStatus);

  return { isPaid, membershipExpiresAt, billingProvider, activeEntitlementId, subscriptionStatus };
}

export async function fetchRevenueCatSubscriber(appUserId: string) {
  const apiKey = getRevenueCatSecretKey();
  const res = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(appUserId)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`RevenueCat subscriber fetch failed (${res.status}): ${body}`);
  }

  const data = (await res.json()) as RevenueCatSubscriberResponse;
  return data.subscriber;
}

export async function syncRevenueCatMembershipByUserId(userId: string) {
  return syncRevenueCatMembershipByUserIdWithContext(userId, {});
}

export async function syncRevenueCatMembershipByUserIdWithContext(
  userId: string,
  context: {
    source?: string;
    eventKey?: string | null;
    eventType?: string | null;
  } = {},
) {
  const subscriber = await fetchRevenueCatSubscriber(userId);
  const {
    membershipExpiresAt,
    billingProvider,
    activeEntitlementId,
    subscriptionStatus,
  } = extractSubscriptionState(subscriber);
  const provider = billingProvider || 'unknown';
  const resolved = await resolveAndPersistSubscriptionSnapshot(userId, {
    provider,
    subscriptionStatus,
    membershipExpiresAt,
    entitlementId: activeEntitlementId,
  }, {
    source: context.source || 'revenuecat_sync',
    eventKey: context.eventKey || null,
    eventType: context.eventType || null,
  });

  return {
    user: null,
    isPaid: resolved.snapshot.isPaid,
    membershipExpiresAt: resolved.snapshot.membershipExpiresAt,
    billingProvider: resolved.snapshot.billingProvider,
    activeEntitlementId: resolved.snapshot.activeEntitlementId,
    subscriptionStatus: resolved.snapshot.subscriptionStatus,
    applied: resolved.applied,
    reason: resolved.reason,
  };
}
