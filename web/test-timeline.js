#!/usr/bin/env node

/**
 * Test script for timeline chart component
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testTimelineData() {
  try {
    console.log('🧪 Testing timeline chart data...');
    
    // Get a sample issuer with trades
    const issuer = await prisma.issuer.findFirst({
      where: {
        Trade: {
          some: {}
        }
      },
      include: {
        Trade: {
          include: {
            Politician: true
          },
          take: 10,
          orderBy: { traded_at: 'desc' }
        }
      }
    });
    
    if (!issuer) {
      console.log('❌ No issuer with trades found');
      return;
    }
    
    console.log(`✅ Found issuer: ${issuer.name} with ${issuer.Trade.length} trades`);
    
    // Test data mapping
    const timelineData = issuer.Trade.map(trade => ({
      id: trade.id,
      traded_at: trade.traded_at,
      type: trade.type,
      politician: {
        id: trade.Politician.id,
        name: trade.Politician.name,
        party: trade.Politician.party,
        chamber: trade.Politician.chamber
      },
      size_min: trade.size_min ? Number(trade.size_min) : undefined,
      size_max: trade.size_max ? Number(trade.size_max) : undefined,
      price: trade.price ? Number(trade.price) : undefined
    }));
    
    console.log('📊 Sample timeline data:');
    timelineData.slice(0, 3).forEach((trade, i) => {
      console.log(`${i + 1}. ${trade.politician.name} - ${trade.type} - ${new Date(trade.traded_at).toLocaleDateString()}`);
    });
    
    // Test date grouping
    const tradesByDate = timelineData.reduce((acc, trade) => {
      try {
        const date = new Date(trade.traded_at);
        if (isNaN(date.getTime())) {
          console.warn('Invalid date for trade:', trade.traded_at);
          return acc;
        }
        const dateKey = date.toISOString().split('T')[0];
        
        if (!acc[dateKey]) {
          acc[dateKey] = [];
        }
        acc[dateKey].push(trade);
      } catch (error) {
        console.warn('Error processing trade date:', error);
      }
      
      return acc;
    }, {});
    
    console.log(`📅 Grouped into ${Object.keys(tradesByDate).length} unique dates`);
    Object.keys(tradesByDate).slice(0, 3).forEach(date => {
      console.log(`  ${date}: ${tradesByDate[date].length} trades`);
    });
    
    console.log('✅ Timeline data processing successful!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testTimelineData();
