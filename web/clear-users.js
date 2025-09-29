#!/usr/bin/env node

// Script to clear user registration data for testing
require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearUserData() {
  try {
    console.log('🧹 Clearing user registration data...\n');

    // Get current user count
    const userCount = await prisma.user.count();
    console.log(`Found ${userCount} users in database`);

    if (userCount === 0) {
      console.log('✅ No users to clear');
      return;
    }

    // Clear sessions first (foreign key constraint)
    console.log('Clearing user sessions...');
    const sessionResult = await prisma.session.deleteMany({});
    console.log(`Deleted ${sessionResult.count} sessions`);

    // Clear user watchlists
    console.log('Clearing user watchlists...');
    const watchlistResult = await prisma.userWatchlist.deleteMany({});
    console.log(`Deleted ${watchlistResult.count} watchlist entries`);

    // Clear users
    console.log('Clearing users...');
    const userResult = await prisma.user.deleteMany({});
    console.log(`Deleted ${userResult.count} users`);

    console.log('\n✅ User data cleared successfully!');
    console.log('You can now test registration with the same emails again.');

  } catch (error) {
    console.error('❌ Error clearing user data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearUserData();
