#!/usr/bin/env node

/**
 * Script to fix membership status for users who paid but didn't get upgraded
 * This can happen if webhook events were missed or failed
 */

const { PrismaClient } = require('@prisma/client');
const Stripe = require('stripe');

const prisma = new PrismaClient();

async function fixMembershipFromStripe() {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('❌ STRIPE_SECRET_KEY is not set');
      process.exit(1);
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    console.log('🔍 Finding users with Stripe customer IDs but FREE membership...\n');

    // Find users who have a Stripe customer ID but are still FREE
    const usersToCheck = await prisma.user.findMany({
      where: {
        stripe_customer_id: { not: null },
        membership_tier: 'FREE',
      },
      select: {
        id: true,
        email: true,
        stripe_customer_id: true,
        membership_tier: true,
      },
    });

    console.log(`Found ${usersToCheck.length} users to check\n`);

    if (usersToCheck.length === 0) {
      console.log('✅ No users need fixing');
      return;
    }

    let fixed = 0;
    let notFound = 0;
    let errors = 0;

    for (const user of usersToCheck) {
      try {
        console.log(`Checking user ${user.email} (${user.id})...`);

        // Get customer's subscriptions
        const subscriptions = await stripe.subscriptions.list({
          customer: user.stripe_customer_id,
          status: 'all',
          limit: 10,
        });

        // Find active or trialing subscription
        const activeSubscription = subscriptions.data.find(
          (sub) => sub.status === 'active' || sub.status === 'trialing'
        );

        if (activeSubscription) {
          const currentPeriodEnd = new Date(activeSubscription.current_period_end * 1000);

          await prisma.user.update({
            where: { id: user.id },
            data: {
              membership_tier: 'PAID',
              membership_expires_at: currentPeriodEnd,
              stripe_subscription_id: activeSubscription.id,
            },
          });

          console.log(`  ✅ Fixed! Updated to PAID, expires ${currentPeriodEnd.toISOString().split('T')[0]}`);
          fixed++;
        } else {
          console.log(`  ⚠️  No active subscription found`);
          notFound++;
        }
      } catch (error) {
        console.error(`  ❌ Error checking user ${user.email}:`, error.message);
        errors++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`  ✅ Fixed: ${fixed}`);
    console.log(`  ⚠️  No active subscription: ${notFound}`);
    console.log(`  ❌ Errors: ${errors}`);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  fixMembershipFromStripe()
    .then(() => {
      console.log('\n✅ Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Error:', error);
      process.exit(1);
    });
}

module.exports = { fixMembershipFromStripe };







