const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function restoreData() {
  try {
    console.log('Starting data restoration...');
    
    // Read backup file
    const backupData = JSON.parse(fs.readFileSync('data_backup.json', 'utf8'));
    
    console.log('Restoring companies...');
    for (const company of backupData.companies) {
      await prisma.openInsiderCompany.create({
        data: {
          id: company.id,
          ticker: company.ticker,
          name: company.name,
          createdAt: new Date(company.createdAt),
          updatedAt: new Date(company.updatedAt)
        }
      });
    }
    
    console.log('Restoring owners...');
    for (const owner of backupData.owners) {
      await prisma.openInsiderOwner.create({
        data: {
          id: owner.id,
          name: owner.name,
          title: owner.title,
          isInstitution: owner.isInstitution,
          createdAt: new Date(owner.createdAt),
          updatedAt: new Date(owner.updatedAt)
        }
      });
    }
    
    console.log('Restoring transactions...');
    for (const transaction of backupData.transactions) {
      await prisma.openInsiderTransaction.create({
        data: {
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
        }
      });
    }
    
    console.log('Restoring users...');
    for (const user of backupData.users) {
      await prisma.user.create({
        data: {
          id: user.id,
          email: user.email,
          password_hash: user.password_hash,
          email_verified: user.email_verified,
          email_verification_token: user.email_verification_token,
          password_reset_token: user.password_reset_token,
          password_reset_expires: user.password_reset_expires ? new Date(user.password_reset_expires) : null,
          created_at: new Date(user.created_at),
          updated_at: new Date(user.updated_at),
          notification_settings: user.notification_settings
        }
      });
    }
    
    console.log('Restoring politicians...');
    for (const politician of backupData.politicians) {
      await prisma.politician.create({
        data: {
          id: politician.id,
          name: politician.name,
          party: politician.party,
          chamber: politician.chamber,
          state: politician.state,
          created_at: new Date(politician.created_at)
        }
      });
    }
    
    console.log('Restoring issuers...');
    for (const issuer of backupData.issuers) {
      await prisma.issuer.create({
        data: {
          id: issuer.id,
          ticker: issuer.ticker,
          name: issuer.name,
          sector: issuer.sector,
          country: issuer.country,
          created_at: new Date(issuer.created_at)
        }
      });
    }
    
    console.log('Restoring trades...');
    for (const trade of backupData.trades) {
      await prisma.trade.create({
        data: {
          id: trade.id,
          politician_id: trade.politician_id,
          issuer_id: trade.issuer_id,
          published_at: trade.published_at ? new Date(trade.published_at) : null,
          traded_at: new Date(trade.traded_at),
          filed_after_days: trade.filed_after_days,
          owner: trade.owner,
          type: trade.type,
          size_min: trade.size_min ? parseFloat(trade.size_min) : null,
          size_max: trade.size_max ? parseFloat(trade.size_max) : null,
          price: trade.price ? parseFloat(trade.price) : null,
          source_url: trade.source_url,
          raw: trade.raw,
          created_at: new Date(trade.created_at)
        }
      });
    }
    
    console.log('Data restoration completed successfully!');
    console.log(`Restored ${backupData.companies.length} companies`);
    console.log(`Restored ${backupData.owners.length} owners`);
    console.log(`Restored ${backupData.transactions.length} transactions`);
    console.log(`Restored ${backupData.users.length} users`);
    console.log(`Restored ${backupData.politicians.length} politicians`);
    console.log(`Restored ${backupData.issuers.length} issuers`);
    console.log(`Restored ${backupData.trades.length} trades`);
    
  } catch (error) {
    console.error('Restoration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreData();



