#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findPennyStocks() {
  try {
    console.log('🔍 Searching for penny stock trades (last 3 days)...');
    
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    console.log(`📅 Date range: ${threeDaysAgo.toISOString().split('T')[0]} to ${new Date().toISOString().split('T')[0]}`);
    
    // Common penny stock tickers and patterns
    const pennyStockPatterns = [
      'TOFB', 'RMCF', 'LCGMF', 'CGEM', 'DLHC', 'BRT', 'SINT', 'MSTR',
      'PENN', 'F', 'GE', 'T', 'BAC', 'C', 'WFC', 'JPM', 'XOM', 'CVX',
      'KO', 'PFE', 'MRK', 'JNJ', 'WMT', 'HD', 'PG', 'VZ', 'DIS', 'NFLX',
      'TSLA', 'AMZN', 'GOOGL', 'MSFT', 'AAPL', 'CSX', 'PNFP', 'TPL', 'CMC'
    ];
    
    console.log('\n🏢 OpenInsider (Corporate Data) - Penny Stocks:');
    const openInsiderTrades = await prisma.openInsiderTransaction.findMany({
      where: {
        transactionDate: {
          gte: threeDaysAgo
        },
        OR: [
          {
            company: {
              ticker: {
                in: pennyStockPatterns
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
    
    console.log(`Found ${openInsiderTrades.length} penny stock trades from corporate insiders:`);
    openInsiderTrades.forEach((trade, i) => {
      const value = trade.valueNumeric ? `$${trade.valueNumeric.toLocaleString()}` : trade.value || 'N/A';
      console.log(`${i+1}. ${trade.owner?.name} - ${trade.transactionType} - ${trade.company?.name} (${trade.company?.ticker}) - ${value} - ${trade.transactionDate?.toISOString().split('T')[0]}`);
    });
    
    // Check Capitol Trades for penny stocks
    console.log('\n🏛️ Capitol Trades (Politician Data) - Penny Stocks:');
    const capitolTrades = await prisma.trade.findMany({
      where: {
        traded_at: {
          gte: threeDaysAgo
        },
        Issuer: {
          OR: [
            {
              ticker: {
                in: pennyStockPatterns
              }
            }
          ]
        }
      },
      include: {
        Politician: true,
        Issuer: true
      },
      orderBy: { traded_at: 'desc' }
    });
    
    console.log(`Found ${capitolTrades.length} penny stock trades from politicians:`);
    capitolTrades.forEach((trade, i) => {
      const value = trade.valueNumeric ? `$${trade.valueNumeric.toLocaleString()}` : trade.value || 'N/A';
      console.log(`${i+1}. ${trade.Politician?.name} - ${trade.type} - ${trade.Issuer?.name} (${trade.Issuer?.ticker}) - ${value} - ${trade.traded_at?.toISOString().split('T')[0]}`);
    });
    
    console.log('\n📊 Summary:');
    console.log(`- Capitol Trades (Politicians): ${capitolTrades.length} trades`);
    console.log(`- OpenInsider (Corporate): ${openInsiderTrades.length} trades`);
    console.log(`- Total penny stock trades: ${capitolTrades.length + openInsiderTrades.length}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findPennyStocks();
















