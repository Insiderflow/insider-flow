#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getTopPoliticiansPerformance() {
  try {
    console.log('📊 Calculating top 3 politicians by performance for 2024...\n');
    
    // Get start and end of 2024
    const startOf2024 = new Date('2024-01-01T00:00:00.000Z');
    const endOf2024 = new Date('2024-12-31T23:59:59.999Z');
    
    console.log(`📅 Date range: ${startOf2024.toISOString().split('T')[0]} to ${endOf2024.toISOString().split('T')[0]}\n`);
    
    // Get all trades from 2024 with politician and issuer info
    const trades = await prisma.trade.findMany({
      where: {
        traded_at: {
          gte: startOf2024,
          lte: endOf2024
        }
      },
      include: {
        Politician: {
          select: {
            id: true,
            name: true,
            party: true,
            chamber: true,
            state: true
          }
        },
        Issuer: {
          select: {
            id: true,
            name: true,
            ticker: true
          }
        }
      }
    });
    
    console.log(`Found ${trades.length} total trades in 2024\n`);
    
    // Group trades by politician and calculate metrics
    const politicianStats = new Map();
    
    trades.forEach(trade => {
      const politicianId = trade.politician_id;
      const politician = trade.Politician;
      
      if (!politicianStats.has(politicianId)) {
        politicianStats.set(politicianId, {
          politician: politician,
          trades: [],
          totalVolume: 0,
          tradeCount: 0,
          buyCount: 0,
          sellCount: 0,
          uniqueIssuers: new Set()
        });
      }
      
      const stats = politicianStats.get(politicianId);
      stats.trades.push(trade);
      stats.tradeCount++;
      
      // Calculate trade volume (use average of size_min and size_max, or size_max if available)
      let tradeVolume = 0;
      if (trade.size_max) {
        tradeVolume = Number(trade.size_max);
      } else if (trade.size_min) {
        tradeVolume = Number(trade.size_min);
      } else if (trade.price && trade.size_min) {
        // Estimate from price and size
        tradeVolume = Number(trade.price) * Number(trade.size_min);
      }
      
      stats.totalVolume += tradeVolume;
      
      // Count buy/sell
      const tradeType = trade.type?.toLowerCase() || '';
      if (tradeType.includes('buy') || tradeType.includes('purchase') || tradeType.includes('acquisition')) {
        stats.buyCount++;
      } else if (tradeType.includes('sell') || tradeType.includes('sale') || tradeType.includes('disposition')) {
        stats.sellCount++;
      }
      
      // Track unique issuers
      if (trade.issuer_id) {
        stats.uniqueIssuers.add(trade.issuer_id);
      }
    });
    
    // Convert to array and calculate performance score
    const politicianArray = Array.from(politicianStats.values()).map(stats => ({
      name: stats.politician.name,
      party: stats.politician.party,
      chamber: stats.politician.chamber,
      state: stats.politician.state,
      tradeCount: stats.tradeCount,
      totalVolume: stats.totalVolume,
      buyCount: stats.buyCount,
      sellCount: stats.sellCount,
      uniqueIssuers: stats.uniqueIssuers.size,
      // Performance score: weighted combination of volume and trade count
      performanceScore: stats.totalVolume * 0.7 + stats.tradeCount * 10000 * 0.3
    }));
    
    // Sort by performance score (descending)
    politicianArray.sort((a, b) => b.performanceScore - a.performanceScore);
    
    // Get top 3
    const top3 = politicianArray.slice(0, 3);
    
    console.log('🏆 TOP 3 POLITICIANS BY PERFORMANCE IN 2024:\n');
    console.log('═'.repeat(80));
    
    top3.forEach((politician, index) => {
      console.log(`\n${index + 1}. ${politician.name}`);
      console.log(`   ${politician.party || 'N/A'} | ${politician.chamber || 'N/A'} | ${politician.state || 'N/A'}`);
      console.log(`   📈 Total Trade Volume: $${politician.totalVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
      console.log(`   📊 Number of Trades: ${politician.tradeCount}`);
      console.log(`   📉 Unique Issuers: ${politician.uniqueIssuers}`);
      console.log(`   ✅ Buys: ${politician.buyCount} | ❌ Sells: ${politician.sellCount}`);
      console.log(`   🎯 Performance Score: ${politician.performanceScore.toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
    });
    
    console.log('\n' + '═'.repeat(80));
    console.log('\n📝 Note: Performance score is calculated as: (Total Volume × 0.7) + (Trade Count × 10,000 × 0.3)');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getTopPoliticiansPerformance();





