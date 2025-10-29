#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findHeicoDetails() {
  try {
    console.log('🔍 Detailed Analysis of Heico Corp (HEI) Insider Trading...');
    
    // Get all HEI trades
    const heicoTrades = await prisma.openInsiderTransaction.findMany({
      where: {
        OR: [
          {
            company: {
              ticker: 'HEI'
            }
          },
          {
            company: {
              name: {
                contains: 'Heico',
                mode: 'insensitive'
              }
            }
          }
        ]
      },
      include: {
        owner: true,
        company: true
      },
      orderBy: { transactionDate: 'desc' }
    });
    
    console.log(`\n📊 Total HEI trades found: ${heicoTrades.length}`);
    
    if (heicoTrades.length === 0) {
      console.log('❌ No HEI trades found in database');
      return;
    }
    
    // Company information
    const company = heicoTrades[0].company;
    console.log(`\n🏢 Company: ${company.name}`);
    console.log(`📈 Ticker: ${company.ticker}`);
    
    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentTrades = heicoTrades.filter(trade => 
      new Date(trade.transactionDate) >= thirtyDaysAgo
    );
    
    console.log(`\n📅 Recent Activity (Last 30 Days): ${recentTrades.length} trades`);
    
    if (recentTrades.length > 0) {
      const totalValue = recentTrades.reduce((sum, trade) => sum + (trade.valueNumeric || 0), 0);
      console.log(`💰 Total Value: $${totalValue.toLocaleString()}`);
      
      const purchases = recentTrades.filter(t => t.transactionType.includes('Purchase'));
      const sales = recentTrades.filter(t => t.transactionType.includes('Sale'));
      console.log(`📈 Purchases: ${purchases.length}, 📉 Sales: ${sales.length}`);
    }
    
    // Group by date
    const tradesByDate = {};
    heicoTrades.forEach(trade => {
      const date = trade.transactionDate.toISOString().split('T')[0];
      if (!tradesByDate[date]) {
        tradesByDate[date] = [];
      }
      tradesByDate[date].push(trade);
    });
    
    console.log(`\n📅 Trades by Date:`);
    Object.keys(tradesByDate).sort().reverse().forEach(date => {
      const dayTrades = tradesByDate[date];
      const dayValue = dayTrades.reduce((sum, trade) => sum + (trade.valueNumeric || 0), 0);
      console.log(`\n${date} (${dayTrades.length} trades, $${dayValue.toLocaleString()}):`);
      
      dayTrades.forEach((trade, i) => {
        const value = trade.valueNumeric ? `$${trade.valueNumeric.toLocaleString()}` : trade.value || 'N/A';
        console.log(`  ${i+1}. ${trade.owner?.name} - ${trade.transactionType} - ${value}`);
      });
    });
    
    // Group by insider
    const tradesByInsider = {};
    heicoTrades.forEach(trade => {
      const insiderName = trade.owner?.name;
      if (!tradesByInsider[insiderName]) {
        tradesByInsider[insiderName] = [];
      }
      tradesByInsider[insiderName].push(trade);
    });
    
    console.log(`\n👥 Trades by Insider:`);
    Object.entries(tradesByInsider)
      .sort((a, b) => b[1].length - a[1].length)
      .forEach(([insider, trades]) => {
        const totalValue = trades.reduce((sum, trade) => sum + (trade.valueNumeric || 0), 0);
        const latestTrade = trades.sort((a, b) => new Date(b.transactionDate) - new Date(a.transactionDate))[0];
        console.log(`\n${insider}:`);
        console.log(`  📊 Total trades: ${trades.length}`);
        console.log(`  💰 Total value: $${totalValue.toLocaleString()}`);
        console.log(`  📅 Latest trade: ${latestTrade.transactionDate.toISOString().split('T')[0]} - ${latestTrade.transactionType} - $${latestTrade.valueNumeric?.toLocaleString() || latestTrade.value || 'N/A'}`);
      });
    
    // Check for patterns
    console.log(`\n🔍 Trading Patterns:`);
    
    // Most active day
    const mostActiveDay = Object.entries(tradesByDate)
      .sort((a, b) => b[1].length - a[1].length)[0];
    
    if (mostActiveDay) {
      console.log(`📅 Most active day: ${mostActiveDay[0]} (${mostActiveDay[1].length} trades)`);
    }
    
    // Value analysis
    const allValues = heicoTrades.map(t => t.valueNumeric || 0).filter(v => v > 0);
    if (allValues.length > 0) {
      const avgValue = allValues.reduce((sum, v) => sum + v, 0) / allValues.length;
      const maxValue = Math.max(...allValues);
      const minValue = Math.min(...allValues);
      
      console.log(`💰 Value analysis:`);
      console.log(`  Average trade: $${avgValue.toLocaleString()}`);
      console.log(`  Largest trade: $${maxValue.toLocaleString()}`);
      console.log(`  Smallest trade: $${minValue.toLocaleString()}`);
    }
    
    // Transaction types
    const transactionTypes = {};
    heicoTrades.forEach(trade => {
      const type = trade.transactionType;
      transactionTypes[type] = (transactionTypes[type] || 0) + 1;
    });
    
    console.log(`\n📈 Transaction Types:`);
    Object.entries(transactionTypes).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} trades`);
    });
    
    // Recent buyers (Oct 14, 2025)
    const oct14Trades = heicoTrades.filter(trade => 
      trade.transactionDate.toISOString().split('T')[0] === '2025-10-14'
    );
    
    if (oct14Trades.length > 0) {
      console.log(`\n🎯 October 14, 2025 - Detailed Analysis:`);
      console.log(`📊 Total trades: ${oct14Trades.length}`);
      
      const oct14Value = oct14Trades.reduce((sum, trade) => sum + (trade.valueNumeric || 0), 0);
      console.log(`💰 Total value: $${oct14Value.toLocaleString()}`);
      
      console.log(`\n👥 All buyers on Oct 14:`);
      oct14Trades.forEach((trade, i) => {
        const value = trade.valueNumeric ? `$${trade.valueNumeric.toLocaleString()}` : trade.value || 'N/A';
        console.log(`  ${i+1}. ${trade.owner?.name} - ${trade.transactionType} - ${value}`);
      });
      
      // Check if all trades are same value
      const values = oct14Trades.map(t => t.valueNumeric).filter(v => v > 0);
      const uniqueValues = [...new Set(values)];
      if (uniqueValues.length === 1) {
        console.log(`\n💡 All trades were for the same amount: $${uniqueValues[0].toLocaleString()}`);
        console.log(`   This suggests a coordinated insider buying program or stock option exercise`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findHeicoDetails();
