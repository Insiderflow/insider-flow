#!/usr/bin/env node

/**
 * Daily Scraper Script
 * This script runs daily to update the database with new data
 * Can be scheduled with cron jobs or GitHub Actions
 */

const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const path = require('path');

const prisma = new PrismaClient();

async function dailyScrape() {
  try {
    console.log('🚀 Starting daily scrape...');
    console.log(`📅 Date: ${new Date().toISOString()}`);
    
    // Step 1: Run the scraping script
    console.log('📊 Step 1: Scraping latest trades from Capitol Trades...');
    try {
      execSync('node scripts/scrape_trades_fixed.js', { 
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      });
      console.log('✅ Scraping completed');
    } catch (error) {
      console.error('❌ Scraping failed:', error.message);
      throw error;
    }
    
    // Step 2: Import the scraped data
    console.log('📥 Step 2: Importing scraped data into database...');
    try {
      execSync('node scripts/import_scraped_trades.js', { 
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      });
      console.log('✅ Import completed');
    } catch (error) {
      console.error('❌ Import failed:', error.message);
      throw error;
    }
    
    // Step 3: Clean up old scraped files (keep only last 3)
    console.log('🧹 Step 3: Cleaning up old files...');
    try {
      const fs = require('fs');
      const files = fs.readdirSync('.').filter(f => f.startsWith('trades_scraped_') && f.endsWith('.json'));
      if (files.length > 3) {
        const filesToDelete = files.sort().slice(0, files.length - 3);
        filesToDelete.forEach(file => {
          fs.unlinkSync(file);
          console.log(`🗑️  Deleted old file: ${file}`);
        });
      }
    } catch (error) {
      console.log('⚠️  Cleanup failed (non-critical):', error.message);
    }
    
    // Step 4: Get final database stats
    console.log('📊 Step 4: Final database statistics...');
    const politicianCount = await prisma.politician.count();
    const tradeCount = await prisma.trade.count();
    const issuerCount = await prisma.issuer.count();
    
    // Get latest trade date
    const latestTrade = await prisma.trade.findFirst({
      orderBy: { traded_at: 'desc' },
      select: { traded_at: true }
    });
    
    console.log('✅ Daily scrape completed successfully!');
    console.log(`📊 Database stats: ${politicianCount} politicians, ${tradeCount} trades, ${issuerCount} issuers`);
    console.log(`📅 Latest trade date: ${latestTrade?.traded_at?.toISOString().split('T')[0] || 'N/A'}`);
    
  } catch (error) {
    console.error('❌ Daily scrape failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the scraper
dailyScrape();
