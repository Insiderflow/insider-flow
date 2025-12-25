/*
 * Diagnostic script to check newsletter status
 * Checks: paid members, recent trades, SendGrid config
 */

require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkNewsletterStatus() {
  console.log('🔍 Checking Newsletter Status...\n');

  // Check database connection
  try {
    await prisma.$connect();
    console.log('✅ Database connection: OK');
  } catch (e) {
    console.error('❌ Database connection: FAILED');
    console.error('   Error:', e.message);
    await prisma.$disconnect();
    return;
  }

  // Check paid members
  try {
    const now = new Date();
    const paidMembers = await prisma.user.findMany({
      where: {
        membership_tier: 'PAID',
        OR: [
          { membership_expires_at: null },
          { membership_expires_at: { gt: now } }
        ],
        email: { not: null }
      },
      select: {
        id: true,
        email: true,
        membership_tier: true,
        membership_expires_at: true
      }
    });
    console.log(`\n👥 Paid Members: ${paidMembers.length}`);
    if (paidMembers.length > 0) {
      console.log('   Sample members:');
      paidMembers.slice(0, 5).forEach(m => {
        const expires = m.membership_expires_at 
          ? new Date(m.membership_expires_at).toISOString().split('T')[0]
          : 'never';
        console.log(`   - ${m.email} (expires: ${expires})`);
      });
    } else {
      console.log('   ⚠️  No paid members found!');
    }
  } catch (e) {
    console.error('❌ Error checking paid members:', e.message);
  }

  // Check recent trades (last 7 days)
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentTrades = await prisma.trade.count({
      where: {
        traded_at: { gte: sevenDaysAgo }
      }
    });
    console.log(`\n📊 Recent Trades (last 7 days): ${recentTrades}`);

    // Check today's trades (HKT)
    const { startUtc, endUtc } = (() => {
      const now = new Date();
      const utcMs = now.getTime();
      const hktOffsetMs = 8 * 60 * 60 * 1000;
      const hktNow = new Date(utcMs + hktOffsetMs);
      const startHkt = new Date(hktNow);
      startHkt.setHours(0, 0, 0, 0);
      const endHkt = new Date(startHkt.getTime() + 24 * 60 * 60 * 1000);
      const startUtc = new Date(startHkt.getTime() - hktOffsetMs);
      const endUtc = new Date(endHkt.getTime() - hktOffsetMs);
      return { startUtc, endUtc };
    })();

    const todayTrades = await prisma.trade.count({
      where: {
        traded_at: { gte: startUtc, lt: endUtc }
      }
    });
    console.log(`   Today's trades (HKT): ${todayTrades}`);
    console.log(`   Date range: ${startUtc.toISOString()} to ${endUtc.toISOString()}`);
  } catch (e) {
    console.error('❌ Error checking trades:', e.message);
  }

  // Check SendGrid config
  console.log('\n📧 SendGrid Configuration:');
  const sendgridKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.NEWSLETTER_FROM_EMAIL || process.env.SENDGRID_FROM_EMAIL;
  console.log(`   API Key: ${sendgridKey ? 'SET (' + sendgridKey.substring(0, 10) + '...)' : 'NOT SET'}`);
  console.log(`   From Email: ${fromEmail || 'NOT SET'}`);
  console.log(`   From Name: ${process.env.NEWSLETTER_FROM_NAME || 'NOT SET (default: Insider Flow)'}`);

  // Check GitHub Actions workflow
  console.log('\n⚙️  GitHub Actions:');
  console.log('   Workflow file: .github/workflows/daily-newsletter.yml');
  console.log('   Schedule: Daily at 9am HKT (1am UTC)');
  console.log('   Manual trigger: Available via workflow_dispatch');
  console.log('\n   To check workflow runs:');
  console.log('   1. Go to GitHub repository → Actions tab');
  console.log('   2. Look for "Daily Newsletter" workflow');
  console.log('   3. Check recent runs for errors');

  await prisma.$disconnect();
  console.log('\n✅ Diagnostic complete');
}

checkNewsletterStatus().catch(console.error);

