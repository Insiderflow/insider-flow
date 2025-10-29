#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findRMCFTrades() {
  try {
    console.log('🔍 Searching for all RMCF (Rocky Mountain Chocolate Factory) trades...');
    
    // Check OpenInsider (corporate data) for RMCF
    console.log('\n🏢 OpenInsider (Corporate Data) - RMCF Trades:');
    const openInsiderTrades = await prisma.openInsiderTransaction.findMany({
      where: {
        OR: [
          {
            company: {
              ticker: 'RMCF'
            }
          },
          {
            company: {
              name: {
                contains: 'Rocky Mountain Chocolate Factory',
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
    
    console.log(`Found ${openInsiderTrades.length} RMCF trades from corporate insiders:`);
    openInsiderTrades.forEach((trade, i) => {
      const value = trade.valueNumeric ? `$${trade.valueNumeric.toLocaleString()}` : trade.value || 'N/A';
      console.log(`${i+1}. ${trade.owner?.name} - ${trade.transactionType} - ${trade.company?.name} (${trade.company?.ticker}) - ${value} - ${trade.transactionDate?.toISOString().split('T')[0]}`);
    });
    
    // Check Capitol Trades (politician data) for RMCF
    console.log('\n🏛️ Capitol Trades (Politician Data) - RMCF Trades:');
    const capitolTrades = await prisma.trade.findMany({
      where: {
        Issuer: {
          OR: [
            {
              ticker: 'RMCF'
            },
            {
              name: {
                contains: 'Rocky Mountain Chocolate Factory',
                mode: 'insensitive'
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
    
    console.log(`Found ${capitolTrades.length} RMCF trades from politicians:`);
    capitolTrades.forEach((trade, i) => {
      const value = trade.valueNumeric ? `$${trade.valueNumeric.toLocaleString()}` : trade.value || 'N/A';
      console.log(`${i+1}. ${trade.Politician?.name} - ${trade.type} - ${trade.Issuer?.name} (${trade.Issuer?.ticker}) - ${value} - ${trade.traded_at?.toISOString().split('T')[0]}`);
    });
    
    // Get company info
    console.log('\n📊 RMCF Company Information:');
    const companyInfo = await prisma.openInsiderCompany.findFirst({
      where: {
        ticker: 'RMCF'
      }
    });
    
    if (companyInfo) {
      console.log(`Company: ${companyInfo.name}`);
      console.log(`Ticker: ${companyInfo.ticker}`);
    }
    
    // Get recent activity summary
    console.log('\n📈 Recent Activity Summary:');
    const recentTrades = openInsiderTrades.filter(trade => {
      const tradeDate = new Date(trade.transactionDate);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return tradeDate >= thirtyDaysAgo;
    });
    
    console.log(`Recent trades (last 30 days): ${recentTrades.length}`);
    
    if (recentTrades.length > 0) {
      const totalValue = recentTrades.reduce((sum, trade) => sum + (trade.valueNumeric || 0), 0);
      console.log(`Total value of recent trades: $${totalValue.toLocaleString()}`);
      
      const purchases = recentTrades.filter(t => t.transactionType.includes('Purchase'));
      const sales = recentTrades.filter(t => t.transactionType.includes('Sale'));
      console.log(`Purchases: ${purchases.length}, Sales: ${sales.length}`);
    }
    
    console.log('\n📊 Summary:');
    console.log(`- Capitol Trades (Politicians): ${capitolTrades.length} trades`);
    console.log(`- OpenInsider (Corporate): ${openInsiderTrades.length} trades`);
    console.log(`- Total RMCF trades: ${capitolTrades.length + openInsiderTrades.length}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findRMCFTrades();
