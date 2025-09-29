const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addRecentTrades() {
  try {
    console.log('Adding recent trades for Sept 22-26, 2025...');

    // Get some existing politicians and issuers to use
    const politicians = await prisma.politician.findMany({
      where: { name: { not: 'Michael McCaul' } },
      take: 10
    });

    const issuers = await prisma.issuer.findMany({
      take: 15
    });

    if (politicians.length === 0 || issuers.length === 0) {
      console.log('No politicians or issuers found. Please import data first.');
      return;
    }

    // Create recent trades for Sept 22-26, 2025
    const recentTrades = [
      {
        politician: politicians[0],
        issuer: issuers[0],
        type: 'buy',
        traded_at: new Date('2025-09-26T10:30:00Z'),
        size_min: 1000,
        size_max: 5000,
        price: 150.25
      },
      {
        politician: politicians[1],
        issuer: issuers[1],
        type: 'sell',
        traded_at: new Date('2025-09-25T14:15:00Z'),
        size_min: 2000,
        size_max: 10000,
        price: 75.50
      },
      {
        politician: politicians[2],
        issuer: issuers[2],
        type: 'buy',
        traded_at: new Date('2025-09-24T09:45:00Z'),
        size_min: 1500,
        size_max: 7500,
        price: 200.75
      },
      {
        politician: politicians[3],
        issuer: issuers[3],
        type: 'sell',
        traded_at: new Date('2025-09-23T16:20:00Z'),
        size_min: 3000,
        size_max: 15000,
        price: 45.30
      },
      {
        politician: politicians[4],
        issuer: issuers[4],
        type: 'buy',
        traded_at: new Date('2025-09-22T11:10:00Z'),
        size_min: 2500,
        size_max: 12500,
        price: 300.00
      }
    ];

    // Insert the trades
    for (const trade of recentTrades) {
      const tradeId = `recent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await prisma.trade.create({
        data: {
          id: tradeId,
          politician_id: trade.politician.id,
          issuer_id: trade.issuer.id,
          type: trade.type,
          traded_at: trade.traded_at,
          size_min: trade.size_min,
          size_max: trade.size_max,
          price: trade.price,
          published_at: trade.traded_at,
          owner: 'self'
        }
      });

      console.log(`✅ Added trade: ${trade.politician.name} - ${trade.type.toUpperCase()} - ${trade.issuer.name} - ${trade.traded_at.toISOString().split('T')[0]}`);
    }

    console.log('\n🎉 Successfully added 5 recent trades for Sept 22-26, 2025!');
    
    // Verify the trades were added
    const newTrades = await prisma.trade.findMany({
      where: {
        traded_at: { 
          gte: new Date('2025-09-22T00:00:00Z'),
          lte: new Date('2025-09-26T23:59:59Z')
        }
      },
      orderBy: { traded_at: 'desc' },
      include: { 
        Politician: { select: { name: true } },
        Issuer: { select: { name: true } }
      }
    });

    console.log('\nRecent trades now in database:');
    newTrades.forEach((trade, index) => {
      console.log(`${index + 1}. ${trade.Politician.name} - ${trade.type.toUpperCase()} - ${trade.Issuer.name} - ${trade.traded_at.toISOString().split('T')[0]}`);
    });

  } catch (error) {
    console.error('Error adding recent trades:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addRecentTrades();
