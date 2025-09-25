#!/usr/bin/env node

/**
 * Daily Scraper Script
 * This script runs daily to update the database with new data
 * Can be scheduled with cron jobs or GitHub Actions
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function dailyScrape() {
  try {
    console.log('🚀 Starting daily scrape...');
    
    // Your scraping logic here
    // This is where you'd:
    // 1. Fetch new data from Capitol Trades API
    // 2. Process and clean the data
    // 3. Insert new records into database
    // 4. Update existing records
    
    console.log('✅ Daily scrape completed');
    
    // Example: Get current counts
    const politicianCount = await prisma.politician.count();
    const tradeCount = await prisma.trade.count();
    const issuerCount = await prisma.issuer.count();
    
    console.log(`📊 Database stats: ${politicianCount} politicians, ${tradeCount} trades, ${issuerCount} issuers`);
    
  } catch (error) {
    console.error('❌ Scrape failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the scraper
dailyScrape();
