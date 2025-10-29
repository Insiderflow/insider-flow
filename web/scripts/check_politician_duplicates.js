#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPoliticianDuplicates() {
  try {
    console.log('🔍 Analyzing politician database for duplicate trades...');
    
    // Get total trade count
    const totalTrades = await prisma.trade.count();
    console.log(`📊 Total trades in database: ${totalTrades.toLocaleString()}`);
    
    // Check for exact duplicates (same politician, issuer, type, date, price)
    console.log('\n🔍 Checking for exact duplicates...');
    const exactDuplicates = await prisma.$queryRaw`
      SELECT 
        politician_id,
        issuer_id,
        type,
        traded_at,
        price,
        COUNT(*) as duplicate_count
      FROM "Trade"
      GROUP BY politician_id, issuer_id, type, traded_at, price
      HAVING COUNT(*) > 1
      ORDER BY duplicate_count DESC
      LIMIT 20
    `;
    
    console.log(`Found ${exactDuplicates.length} groups of exact duplicates:`);
    exactDuplicates.forEach((dup, i) => {
      console.log(`${i+1}. Politician: ${dup.politician_id}, Issuer: ${dup.issuer_id}, Type: ${dup.type}, Date: ${dup.traded_at}, Price: ${dup.price} - ${dup.duplicate_count} duplicates`);
    });
    
    // Check for near duplicates (same politician, issuer, type, same day)
    console.log('\n🔍 Checking for near duplicates (same day)...');
    const nearDuplicates = await prisma.$queryRaw`
      SELECT 
        politician_id,
        issuer_id,
        type,
        DATE(traded_at) as trade_date,
        COUNT(*) as duplicate_count
      FROM "Trade"
      GROUP BY politician_id, issuer_id, type, DATE(traded_at)
      HAVING COUNT(*) > 1
      ORDER BY duplicate_count DESC
      LIMIT 20
    `;
    
    console.log(`Found ${nearDuplicates.length} groups of near duplicates (same day):`);
    nearDuplicates.forEach((dup, i) => {
      console.log(`${i+1}. Politician: ${dup.politician_id}, Issuer: ${dup.issuer_id}, Type: ${dup.type}, Date: ${dup.trade_date} - ${dup.duplicate_count} duplicates`);
    });
    
    // Get sample of potential duplicates with politician and issuer names
    console.log('\n📋 Sample duplicate trades with details:');
    if (exactDuplicates.length > 0) {
      const sampleDuplicates = await prisma.trade.findMany({
        where: {
          politician_id: exactDuplicates[0]?.politician_id,
          issuer_id: exactDuplicates[0]?.issuer_id,
          type: exactDuplicates[0]?.type,
          traded_at: exactDuplicates[0]?.traded_at,
          price: exactDuplicates[0]?.price
        },
        include: {
          Politician: true,
          Issuer: true
        },
        orderBy: { id: 'asc' }
      });
    
      if (sampleDuplicates.length > 0) {
        console.log(`\nExample: ${sampleDuplicates[0].Politician?.name} - ${sampleDuplicates[0].type} - ${sampleDuplicates[0].Issuer?.name} (${sampleDuplicates[0].Issuer?.ticker})`);
        console.log(`Date: ${sampleDuplicates[0].traded_at}, Price: ${sampleDuplicates[0].price}`);
        console.log(`Found ${sampleDuplicates.length} identical records:`);
        sampleDuplicates.forEach((trade, i) => {
          console.log(`  ${i+1}. ID: ${trade.id}, Created: ${trade.created_at}`);
        });
      }
    }
    
    // Check for duplicates by politician and issuer (regardless of date)
    console.log('\n🔍 Checking for politician-issuer pairs with multiple trades...');
    const politicianIssuerPairs = await prisma.$queryRaw`
      SELECT 
        politician_id,
        issuer_id,
        COUNT(*) as trade_count
      FROM "Trade"
      GROUP BY politician_id, issuer_id
      HAVING COUNT(*) > 1
      ORDER BY trade_count DESC
      LIMIT 20
    `;
    
    console.log(`Found ${politicianIssuerPairs.length} politician-issuer pairs with multiple trades:`);
    politicianIssuerPairs.forEach((pair, i) => {
      console.log(`${i+1}. Politician: ${pair.politician_id}, Issuer: ${pair.issuer_id} - ${pair.trade_count} trades`);
    });
    
    // Get detailed example of politician-issuer pair
    if (politicianIssuerPairs.length > 0) {
      console.log('\n📋 Sample politician-issuer pair with multiple trades:');
      const samplePair = await prisma.trade.findMany({
        where: {
          politician_id: politicianIssuerPairs[0].politician_id,
          issuer_id: politicianIssuerPairs[0].issuer_id
        },
        include: {
          Politician: true,
          Issuer: true
        },
        orderBy: { traded_at: 'desc' }
      });
      
      if (samplePair.length > 0) {
        console.log(`\n${samplePair[0].Politician?.name} trading ${samplePair[0].Issuer?.name} (${samplePair[0].Issuer?.ticker}):`);
        samplePair.forEach((trade, i) => {
          console.log(`  ${i+1}. ${trade.type} - ${trade.traded_at} - $${trade.price} (ID: ${trade.id})`);
        });
      }
    }
    
    // Check for potential data quality issues
    console.log('\n🔍 Data quality analysis:');
    
    // Check for trades with null values
    const nullPolitician = await prisma.trade.count({
      where: { politician_id: null }
    });
    const nullIssuer = await prisma.trade.count({
      where: { issuer_id: null }
    });
    const nullDate = await prisma.trade.count({
      where: { traded_at: null }
    });
    
    console.log(`❌ Trades with null politician_id: ${nullPolitician}`);
    console.log(`❌ Trades with null issuer_id: ${nullIssuer}`);
    console.log(`❌ Trades with null traded_at: ${nullDate}`);
    
    // Check for trades with same ID (shouldn't happen)
    const duplicateIds = await prisma.$queryRaw`
      SELECT id, COUNT(*) as count
      FROM "Trade"
      GROUP BY id
      HAVING COUNT(*) > 1
    `;
    
    console.log(`❌ Duplicate IDs found: ${duplicateIds.length}`);
    
    // Summary statistics
    console.log('\n📊 Summary:');
    console.log(`- Total trades: ${totalTrades.toLocaleString()}`);
    console.log(`- Exact duplicate groups: ${exactDuplicates.length}`);
    console.log(`- Near duplicate groups: ${nearDuplicates.length}`);
    console.log(`- Politician-issuer pairs with multiple trades: ${politicianIssuerPairs.length}`);
    
    // Calculate potential duplicate count
    const totalExactDuplicates = exactDuplicates.reduce((sum, dup) => sum + (dup.duplicate_count - 1), 0);
    const totalNearDuplicates = nearDuplicates.reduce((sum, dup) => sum + (dup.duplicate_count - 1), 0);
    
    console.log(`- Estimated exact duplicates: ${totalExactDuplicates}`);
    console.log(`- Estimated near duplicates: ${totalNearDuplicates}`);
    
    if (totalExactDuplicates > 0) {
      console.log(`\n⚠️  Recommendation: Consider cleaning up ${totalExactDuplicates} exact duplicate trades`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPoliticianDuplicates();
