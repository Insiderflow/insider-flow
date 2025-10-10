const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function backupData() {
  try {
    console.log('Starting data backup...');
    
    // Backup OpenInsider data
    const companies = await prisma.openInsiderCompany.findMany();
    const owners = await prisma.openInsiderOwner.findMany();
    const transactions = await prisma.openInsiderTransaction.findMany();
    
    // Backup other data
    const users = await prisma.user.findMany();
    const politicians = await prisma.politician.findMany();
    const trades = await prisma.trade.findMany();
    const issuers = await prisma.issuer.findMany();
    
    const backup = {
      companies,
      owners,
      transactions,
      users,
      politicians,
      trades,
      issuers,
      timestamp: new Date().toISOString()
    };
    
    const fs = require('fs');
    fs.writeFileSync('data_backup.json', JSON.stringify(backup, null, 2));
    
    console.log('Backup completed successfully!');
    console.log(`Companies: ${companies.length}`);
    console.log(`Owners: ${owners.length}`);
    console.log(`Transactions: ${transactions.length}`);
    console.log(`Users: ${users.length}`);
    console.log(`Politicians: ${politicians.length}`);
    console.log(`Trades: ${trades.length}`);
    console.log(`Issuers: ${issuers.length}`);
    
  } catch (error) {
    console.error('Backup failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

backupData();



