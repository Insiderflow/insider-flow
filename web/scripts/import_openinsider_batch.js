#!/usr/bin/env node

const { PrismaClient } = require('../../generated/prisma');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const prisma = new PrismaClient();

function cleanNumericValue(value) {
  if (!value || value === 'n/a' || value === 'new') return 0;
  const cleaned = value.replace(/[\$,+]/g, '').replace(/,/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

async function main() {
  try {
    console.log('🚀 Starting OpenInsider batch import...');
    
    const csvPath = path.resolve(__dirname, '../../..', 'opensecret', 'insider_trades_2023_2025.csv');
    if (!fs.existsSync(csvPath)) {
      console.error(`❌ CSV not found at ${csvPath}`);
      process.exit(1);
    }

    console.log(`📁 Source: ${csvPath}`);

    // Clear existing data first
    console.log('🧹 Clearing existing OpenInsider data...');
    await prisma.openInsiderTransaction.deleteMany();
    await prisma.openInsiderCompany.deleteMany();
    await prisma.openInsiderOwner.deleteMany();

    const companies = new Map();
    const owners = new Map();
    const transactions = [];

    // Read and process CSV
    console.log('📖 Reading CSV...');
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (row) => {
          // Process company
          const ticker = row.ticker;
          if (ticker && !companies.has(ticker)) {
            companies.set(ticker, {
              ticker: ticker,
              name: row.company_name || ticker
            });
          }

          // Process owner
          const ownerName = row.owner_name;
          if (ownerName && !owners.has(ownerName)) {
            const isInstitution = /LLC|LP|LLP|Corp|Inc|Ltd|Partners|Capital|Fund|Management|Holdings|Group|Advisors|Associates|Trust|Bank|Financial|Insurance|Mutual|Asset|Equity|Venture|Private|Hedge/i.test(ownerName);
            
            owners.set(ownerName, {
              name: ownerName,
              title: row.Title || null,
              isInstitution: isInstitution
            });
          }

          // Process transaction
          if (ticker && ownerName) {
            const valueNumeric = cleanNumericValue(row.Value);
            
            transactions.push({
              transactionDate: new Date(row.transaction_date),
              tradeDate: new Date(row.trade_date),
              transactionType: row.transaction_type,
              lastPrice: row.last_price ? parseFloat(row.last_price.replace('$', '')) : null,
              quantity: row.Qty,
              sharesHeld: row.shares_held,
              owned: row.Owned,
              value: row.Value,
              valueNumeric: valueNumeric,
              companyTicker: ticker,
              ownerName: ownerName
            });
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });

    console.log(`Found ${companies.size} companies, ${owners.size} owners, ${transactions.length} transactions`);

    // Insert companies in batches
    console.log('📊 Inserting companies...');
    const companyArray = Array.from(companies.values());
    const companyBatchSize = 100;
    for (let i = 0; i < companyArray.length; i += companyBatchSize) {
      const batch = companyArray.slice(i, i + companyBatchSize);
      await prisma.openInsiderCompany.createMany({
        data: batch,
        skipDuplicates: true
      });
      console.log(`Inserted companies batch ${Math.floor(i/companyBatchSize) + 1}/${Math.ceil(companyArray.length/companyBatchSize)}`);
    }

    // Insert owners in batches
    console.log('👥 Inserting owners...');
    const ownerArray = Array.from(owners.values());
    const ownerBatchSize = 100;
    for (let i = 0; i < ownerArray.length; i += ownerBatchSize) {
      const batch = ownerArray.slice(i, i + ownerBatchSize);
      await prisma.openInsiderOwner.createMany({
        data: batch,
        skipDuplicates: true
      });
      console.log(`Inserted owners batch ${Math.floor(i/ownerBatchSize) + 1}/${Math.ceil(ownerArray.length/ownerBatchSize)}`);
    }

    // Get company and owner IDs
    console.log('🔗 Mapping IDs...');
    const dbCompanies = await prisma.openInsiderCompany.findMany();
    const dbOwners = await prisma.openInsiderOwner.findMany();
    
    const companyMap = new Map();
    const ownerMap = new Map();
    
    dbCompanies.forEach(company => {
      companyMap.set(company.ticker, company.id);
    });
    
    dbOwners.forEach(owner => {
      ownerMap.set(owner.name, owner.id);
    });

    console.log(`Mapped ${companyMap.size} companies, ${ownerMap.size} owners`);

    // Insert transactions in batches
    console.log('💼 Inserting transactions...');
    const transactionBatchSize = 500;
    let validTransactions = 0;
    
    for (let i = 0; i < transactions.length; i += transactionBatchSize) {
      const batch = transactions.slice(i, i + transactionBatchSize);
      const transactionData = batch.map(t => ({
        transactionDate: t.transactionDate,
        tradeDate: t.tradeDate,
        transactionType: t.transactionType,
        lastPrice: t.lastPrice,
        quantity: t.quantity,
        sharesHeld: t.sharesHeld,
        owned: t.owned,
        value: t.value,
        valueNumeric: t.valueNumeric,
        companyId: companyMap.get(t.companyTicker),
        ownerId: ownerMap.get(t.ownerName)
      })).filter(t => t.companyId && t.ownerId);

      if (transactionData.length > 0) {
        await prisma.openInsiderTransaction.createMany({
          data: transactionData,
          skipDuplicates: true
        });
        validTransactions += transactionData.length;
      }
      
      console.log(`Processed transaction batch ${Math.floor(i/transactionBatchSize) + 1}/${Math.ceil(transactions.length/transactionBatchSize)} (${validTransactions} valid)`);
    }

    // Final verification
    const finalCounts = await Promise.all([
      prisma.openInsiderCompany.count(),
      prisma.openInsiderOwner.count(),
      prisma.openInsiderTransaction.count()
    ]);

    console.log('✅ OpenInsider data import completed!');
    console.log(`📊 Final counts: ${finalCounts[0]} companies, ${finalCounts[1]} owners, ${finalCounts[2]} transactions`);

  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();




