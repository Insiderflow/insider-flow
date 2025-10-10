#!/usr/bin/env node

/**
 * Test script for notification system
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testNotificationSystem() {
  try {
    console.log('🧪 Testing notification system...');
    
    // Check if there are any users with notification settings
    const users = await prisma.user.findMany({
      where: {
        email_verified: true
      },
      select: {
        id: true,
        email: true,
        notification_settings: true
      }
    });
    
    console.log(`📊 Found ${users.length} verified users`);
    
    if (users.length === 0) {
      console.log('⚠️  No verified users found. Create a test user first.');
      return;
    }
    
    // Check notification settings
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   Settings: ${JSON.stringify(user.notification_settings)}`);
    });
    
    // Check if there are any watchlists
    const watchlists = await prisma.userWatchlist.findMany({
      include: {
        User: { select: { email: true } },
        Politician: { select: { name: true } }
      }
    });
    
    console.log(`\n📋 Found ${watchlists.length} watchlist entries:`);
    watchlists.forEach((watch, index) => {
      console.log(`${index + 1}. ${watch.User.email} watches ${watch.Politician.name}`);
    });
    
    // Test the notification logic
    console.log('\n🔍 Testing notification logic...');
    
    // Simulate a trade from a politician that might be watched
    const testPoliticianId = watchlists.length > 0 ? watchlists[0].politician_id : 'test-politician';
    const testPoliticianName = watchlists.length > 0 ? watchlists[0].Politician.name : 'Test Politician';
    
    console.log(`Testing with politician: ${testPoliticianName} (${testPoliticianId})`);
    
    // Find users who would receive watchlist notifications for this politician
    const watchlistUsers = await prisma.user.findMany({
      where: {
        email_verified: true,
        notification_settings: {
          path: ['watchlistUpdates'],
          equals: true,
        },
        UserWatchlist: {
          some: {
            politician_id: testPoliticianId
          }
        }
      },
      select: {
        email: true,
        notification_settings: true
      }
    });
    
    console.log(`📧 Users who would receive watchlist notifications: ${watchlistUsers.length}`);
    watchlistUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email}`);
    });
    
    // Find users who would receive general new trade notifications
    const generalUsers = await prisma.user.findMany({
      where: {
        email_verified: true,
        notification_settings: {
          path: ['newTrades'],
          equals: true,
        }
      },
      select: {
        email: true
      }
    });
    
    console.log(`📧 Users who would receive general trade notifications: ${generalUsers.length}`);
    generalUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email}`);
    });
    
    console.log('\n✅ Notification system test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testNotificationSystem();






