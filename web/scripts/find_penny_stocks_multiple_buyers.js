#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findPennyStocksMultipleBuyers() {
  try {
    console.log('🔍 Searching for penny stock trades with multiple buyers (past 2 weeks)...');
    
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    console.log(`📅 Date range: ${twoWeeksAgo.toISOString().split('T')[0]} to ${new Date().toISOString().split('T')[0]}`);
    
    // Get all trades from past 2 weeks
    const recentTrades = await prisma.openInsiderTransaction.findMany({
      where: {
        transactionDate: {
          gte: twoWeeksAgo
        },
        transactionType: {
          contains: 'Purchase'
        }
      },
      include: {
        owner: true,
        company: true
      },
      orderBy: { transactionDate: 'desc' }
    });
    
    console.log(`\n📊 Found ${recentTrades.length} purchase transactions in past 2 weeks`);
    
    // Group by company ticker and find those with multiple buyers
    const tradesByCompany = {};
    
    recentTrades.forEach(trade => {
      const ticker = trade.company?.ticker;
      if (!ticker) return;
      
      if (!tradesByCompany[ticker]) {
        tradesByCompany[ticker] = {
          company: trade.company,
          trades: [],
          buyers: new Set()
        };
      }
      
      tradesByCompany[ticker].trades.push(trade);
      tradesByCompany[ticker].buyers.add(trade.owner?.name);
    });
    
    // Filter for companies with multiple buyers
    const multiBuyerCompanies = Object.entries(tradesByCompany)
      .filter(([ticker, data]) => data.buyers.size > 1)
      .sort((a, b) => b[1].buyers.size - a[1].buyers.size); // Sort by number of buyers
    
    console.log(`\n🏢 Companies with Multiple Buyers (${multiBuyerCompanies.length} companies):`);
    
    multiBuyerCompanies.forEach(([ticker, data], index) => {
      console.log(`\n${index + 1}. ${data.company.name} (${ticker})`);
      console.log(`   📈 Buyers: ${data.buyers.size} different insiders`);
      console.log(`   💰 Total trades: ${data.trades.length}`);
      
      // Calculate total value
      const totalValue = data.trades.reduce((sum, trade) => sum + (trade.valueNumeric || 0), 0);
      console.log(`   💵 Total value: $${totalValue.toLocaleString()}`);
      
      // Show recent trades
      console.log(`   📋 Recent trades:`);
      data.trades.slice(0, 5).forEach((trade, i) => {
        const value = trade.valueNumeric ? `$${trade.valueNumeric.toLocaleString()}` : trade.value || 'N/A';
        console.log(`      ${i+1}. ${trade.owner?.name} - ${value} - ${trade.transactionDate?.toISOString().split('T')[0]}`);
      });
      
      if (data.trades.length > 5) {
        console.log(`      ... and ${data.trades.length - 5} more trades`);
      }
      
      // Show all buyers
      console.log(`   👥 All buyers: ${Array.from(data.buyers).join(', ')}`);
    });
    
    // Also check for penny stock patterns
    console.log(`\n🔍 Penny Stock Analysis:`);
    
    const pennyStockTickers = ['TOFB', 'RMCF', 'LCGMF', 'CGEM', 'DLHC', 'BRT', 'SINT', 'MSTR', 'CSX', 'PNFP', 'TPL', 'CMC'];
    
    const pennyStockCompanies = multiBuyerCompanies.filter(([ticker, data]) => 
      pennyStockTickers.includes(ticker) || 
      data.company.name.toLowerCase().includes('chocolate') ||
      data.company.name.toLowerCase().includes('copper') ||
      data.company.name.toLowerCase().includes('therapeutics') ||
      data.company.name.toLowerCase().includes('holdings') ||
      data.company.name.toLowerCase().includes('metals') ||
      data.company.name.toLowerCase().includes('technologies')
    );
    
    console.log(`\n💰 Penny Stock Companies with Multiple Buyers (${pennyStockCompanies.length}):`);
    
    pennyStockCompanies.forEach(([ticker, data], index) => {
      console.log(`\n${index + 1}. ${data.company.name} (${ticker})`);
      console.log(`   📈 Buyers: ${data.buyers.size} different insiders`);
      console.log(`   💰 Total trades: ${data.trades.length}`);
      
      const totalValue = data.trades.reduce((sum, trade) => sum + (trade.valueNumeric || 0), 0);
      console.log(`   💵 Total value: $${totalValue.toLocaleString()}`);
      
      console.log(`   👥 Buyers: ${Array.from(data.buyers).join(', ')}`);
    });
    
    console.log(`\n📊 Summary:`);
    console.log(`- Total companies with multiple buyers: ${multiBuyerCompanies.length}`);
    console.log(`- Penny stock companies with multiple buyers: ${pennyStockCompanies.length}`);
    console.log(`- Total purchase transactions: ${recentTrades.length}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findPennyStocksMultipleBuyers();
















