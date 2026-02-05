const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const total = await prisma.politician.count();
  console.log('Total politicians in database:', total);
  
  const withTrades2024 = await prisma.politician.count({
    where: {
      Trade: {
        some: {
          traded_at: {
            gte: new Date('2024-01-01'),
            lte: new Date('2024-12-31')
          }
        }
      }
    }
  });
  console.log('Politicians with ANY trades in 2024:', withTrades2024);
  
  const withTickerTrades = await prisma.politician.count({
    where: {
      Trade: {
        some: {
          traded_at: {
            gte: new Date('2024-01-01'),
            lte: new Date('2024-12-31')
          },
          Issuer: {
            ticker: { not: null }
          }
        }
      }
    }
  });
  console.log('Politicians with trades that have TICKERS in 2024:', withTickerTrades);
  
  await prisma.$disconnect();
})();









