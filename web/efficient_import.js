const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function efficientImport() {
  try {
    console.log('Starting efficient batch import...');
    
    // Read backup file
    const backupData = JSON.parse(fs.readFileSync('data_backup.json', 'utf8'));
    
    console.log('Importing companies in batches...');
    const companyBatches = [];
    for (let i = 0; i < backupData.companies.length; i += 100) {
      companyBatches.push(backupData.companies.slice(i, i + 100));
    }
    
    for (let i = 0; i < companyBatches.length; i++) {
      await prisma.openInsiderCompany.createMany({
        data: companyBatches[i].map(company => ({
          id: company.id,
          ticker: company.ticker,
          name: company.name,
          createdAt: new Date(company.createdAt),
          updatedAt: new Date(company.updatedAt)
        })),
        skipDuplicates: true
      });
      console.log(`Companies batch ${i + 1}/${companyBatches.length} completed`);
    }
    
    console.log('Importing owners in batches...');
    const ownerBatches = [];
    for (let i = 0; i < backupData.owners.length; i += 100) {
      ownerBatches.push(backupData.owners.slice(i, i + 100));
    }
    
    for (let i = 0; i < ownerBatches.length; i++) {
      await prisma.openInsiderOwner.createMany({
        data: ownerBatches[i].map(owner => ({
          id: owner.id,
          name: owner.name,
          title: owner.title,
          isInstitution: owner.isInstitution,
          createdAt: new Date(owner.createdAt),
          updatedAt: new Date(owner.updatedAt)
        })),
        skipDuplicates: true
      });
      console.log(`Owners batch ${i + 1}/${ownerBatches.length} completed`);
    }
    
    console.log('Importing transactions in batches...');
    const transactionBatches = [];
    for (let i = 0; i < backupData.transactions.length; i += 50) {
      transactionBatches.push(backupData.transactions.slice(i, i + 50));
    }
    
    for (let i = 0; i < transactionBatches.length; i++) {
      await prisma.openInsiderTransaction.createMany({
        data: transactionBatches[i].map(transaction => ({
          id: transaction.id,
          transactionDate: new Date(transaction.transactionDate),
          tradeDate: new Date(transaction.tradeDate),
          transactionType: transaction.transactionType,
          lastPrice: transaction.lastPrice ? parseFloat(transaction.lastPrice) : null,
          quantity: transaction.quantity,
          sharesHeld: transaction.sharesHeld,
          owned: transaction.owned,
          value: transaction.value,
          valueNumeric: transaction.valueNumeric ? parseFloat(transaction.valueNumeric) : null,
          companyId: transaction.companyId,
          ownerId: transaction.ownerId,
          createdAt: new Date(transaction.createdAt),
          updatedAt: new Date(transaction.updatedAt)
        })),
        skipDuplicates: true
      });
      console.log(`Transactions batch ${i + 1}/${transactionBatches.length} completed`);
    }
    
    console.log('Efficient import completed successfully!');
    console.log(`Imported ${backupData.companies.length} companies`);
    console.log(`Imported ${backupData.owners.length} owners`);
    console.log(`Imported ${backupData.transactions.length} transactions`);
    
  } catch (error) {
    console.error('Import failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

efficientImport();



