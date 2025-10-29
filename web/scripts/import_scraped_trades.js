#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function importScrapedTrades() {
  try {
    console.log('🚀 Starting import of scraped trades...');
    
    // Find the most recent scraped file
    const files = fs.readdirSync('.').filter(f => f.startsWith('trades_scraped_') && f.endsWith('.json'));
    if (files.length === 0) {
      console.log('❌ No scraped trade files found');
      return;
    }
    
    const latestFile = files.sort().pop();
    console.log(`📁 Using file: ${latestFile}`);
    
    const data = JSON.parse(fs.readFileSync(latestFile, 'utf8'));
    console.log(`📊 Found ${data.length} trades to process`);
    
    let imported = 0;
    let skipped = 0;
    let updated = 0;
    
    for (const trade of data) {
      try {
        // Skip if we don't have required data
        if (!trade.politicianId || !trade.issuerId || !trade.tradedAt) {
          console.log(`⚠️  Skipping trade - missing required data`);
          skipped++;
          continue;
        }
        
        // Ensure politician exists
        await prisma.politician.upsert({
          where: { id: trade.politicianId },
          update: {
            name: trade.politicianName || 'Unknown Politician'
          },
          create: {
            id: trade.politicianId,
            name: trade.politicianName || 'Unknown Politician',
            party: null,
            chamber: trade.politicianChamber || null,
            state: null
          }
        });
        
        // Ensure issuer exists
        await prisma.issuer.upsert({
          where: { id: trade.issuerId },
          update: {
            name: trade.issuerName || 'Unknown Issuer',
            ticker: trade.ticker || null
          },
          create: {
            id: trade.issuerId,
            name: trade.issuerName || 'Unknown Issuer',
            ticker: trade.ticker || null,
            sector: null,
            country: null
          }
        });
        
        // Check for existing trade by content (not just ID) to prevent duplicates
        const existingTrade = await prisma.trade.findFirst({
          where: {
            politician_id: trade.politicianId,
            issuer_id: trade.issuerId,
            traded_at: new Date(trade.tradedAt),
            type: trade.type,
            price: trade.price ? parseFloat(trade.price) : null
          }
        });
        
        if (existingTrade) {
          // Skip duplicate trade
          console.log(`⚠️  Skipping duplicate trade: ${trade.politicianName} - ${trade.type} - ${trade.issuerName} - ${new Date(trade.tradedAt).toISOString().split('T')[0]}`);
          skipped++;
          continue;
        }
        
        // Create new trade (no duplicates found)
        const newTrade = await prisma.trade.create({
          data: {
            id: trade.tradeId,
            politician_id: trade.politicianId,
            issuer_id: trade.issuerId,
            traded_at: new Date(trade.tradedAt),
            type: trade.type,
            size_min: trade.sizeMin ? parseFloat(trade.sizeMin) : null,
            size_max: trade.sizeMax ? parseFloat(trade.sizeMax) : null,
            price: trade.price ? parseFloat(trade.price) : null,
            published_at: trade.publishedAt ? new Date(trade.publishedAt) : null,
            filed_after_days: trade.filedAfterDays ? parseInt(trade.filedAfterDays) : null,
            owner: trade.owner || 'unknown',
            source_url: trade.detailUrl || null,
            raw: {
              politicianName: trade.politicianName,
              issuerName: trade.issuerName,
              sizeText: trade.sizeText,
              ticker: trade.ticker
            }
          }
        });
        imported++;
        
        console.log(`✅ Processed: ${trade.politicianName} - ${trade.type} - ${trade.issuerName} - ${new Date(trade.tradedAt).toISOString().split('T')[0]}`);
        
      } catch (error) {
        console.log(`❌ Error processing trade:`, error.message);
        skipped++;
      }
    }
    
    console.log(`\n🎉 Import completed!`);
    console.log(`✅ Imported: ${imported} new trades`);
    console.log(`🔄 Updated: ${updated} existing trades`);
    console.log(`⚠️  Skipped: ${skipped} trades`);
    
    // Show latest trades in database
    const latestTrades = await prisma.trade.findMany({
      where: {
        traded_at: { 
          lte: new Date(),
          gte: new Date('2020-01-01')
        }
      },
      orderBy: { traded_at: 'desc' },
      take: 5,
      include: { 
        Politician: { select: { name: true } },
        Issuer: { select: { name: true } }
      }
    });
    
    console.log(`\n📊 Latest 5 trades in database:`);
    latestTrades.forEach((trade, index) => {
      console.log(`${index + 1}. ${trade.Politician.name} - ${trade.type} - ${trade.Issuer.name} - ${trade.traded_at.toISOString().split('T')[0]}`);
    });
    
  } catch (error) {
    console.error('❌ Import failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importScrapedTrades();

