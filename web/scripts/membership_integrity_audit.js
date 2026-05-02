#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const PAID_STATUSES = new Set(['active', 'trialing', 'grace_period']);

function normalizeStatus(status, tier) {
  const v = String(status || '').toLowerCase();
  if (['free', 'active', 'trialing', 'grace_period', 'expired', 'canceled'].includes(v)) return v;
  return tier === 'PAID' ? 'active' : 'free';
}

function isPaidByStatus(status) {
  return PAID_STATUSES.has(status);
}

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      membership_tier: true,
      membership_expires_at: true,
      subscription_status: true,
      billing_provider: true,
      stripe_subscription_id: true,
      subscription_entitlement_id: true,
      subscription_last_synced_at: true,
      updated_at: true,
    },
  });

  const now = Date.now();
  const issues = [];

  for (const u of users) {
    const normalized = normalizeStatus(u.subscription_status, u.membership_tier);
    const paidByStatus = isPaidByStatus(normalized);
    const expired = Boolean(u.membership_expires_at && u.membership_expires_at.getTime() < now);
    const tierPaid = u.membership_tier === 'PAID';
    const hasProviderMarker = Boolean(u.billing_provider || u.stripe_subscription_id || u.subscription_entitlement_id);

    const userIssues = [];

    if (tierPaid && !paidByStatus) userIssues.push('PAID tier but non-paid subscription status');
    if (!tierPaid && paidByStatus) userIssues.push('FREE tier but paid subscription status');
    if (tierPaid && expired) userIssues.push('PAID tier but membership_expires_at already passed');
    if (paidByStatus && !hasProviderMarker) userIssues.push('Paid status but missing provider marker');
    if (u.billing_provider && !['stripe', 'revenuecat'].includes(String(u.billing_provider).toLowerCase())) {
      userIssues.push(`Unknown billing_provider: ${u.billing_provider}`);
    }

    if (userIssues.length) {
      issues.push({
        id: u.id,
        email: u.email,
        membership_tier: u.membership_tier,
        subscription_status: u.subscription_status,
        normalized_status: normalized,
        membership_expires_at: u.membership_expires_at ? u.membership_expires_at.toISOString() : null,
        billing_provider: u.billing_provider,
        stripe_subscription_id: u.stripe_subscription_id,
        subscription_entitlement_id: u.subscription_entitlement_id,
        subscription_last_synced_at: u.subscription_last_synced_at
          ? u.subscription_last_synced_at.toISOString()
          : null,
        updated_at: u.updated_at.toISOString(),
        issues: userIssues,
      });
    }
  }

  const output = {
    ok: issues.length === 0,
    totals: {
      users: users.length,
      flagged: issues.length,
    },
    flagged: issues,
  };

  console.log(JSON.stringify(output, null, 2));
  if (!output.ok) {
    process.exit(2);
  }
}

main()
  .catch((error) => {
    console.error('membership_audit_failed', error instanceof Error ? error.message : String(error));
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
