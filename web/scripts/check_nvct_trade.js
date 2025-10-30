#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkNVCTTrade() {
  try {
    // Check if NVCT company exists
    const company = await prisma.openInsiderCompany.findUnique({
      where: { ticker: 'NVCT' },
      include: {
        transactions: {
          where: {
            transactionDate: {
              gte: new Date('2025-10-23'),
              lte: new Date('2025-10-24'),
            }
          },
          include: { owner: true },
          orderBy: { transactionDate: 'desc' },
        }
      }
    });
    
    if (company) {
      console.log(`\n✅ NVCT company found: ${company.name}`);
      console.log(`📊 Transactions around 2025-10-23: ${company.transactions.length}`);
      
      if (company.transactions.length > 0) {
        company.transactions.forEach(t => {
          console.log(`\n  Transaction:`);
          console.log(`    Date: ${t.transactionDate}`);
          console.log(`    Owner: ${t.owner.name} (${t.owner.title})`);
          console.log(`    Type: ${t.transactionType}`);
          console.log(`    Value: ${t.value}`);
        });
      } else {
        console.log('\n❌ NVCT trade from 2025-10-23 NOT found in database');
      }
    } else {
      console.log('\n❌ NVCT company NOT found in database');
    }
    
    // Also check latest transactions overall
    const latest = await prisma.openInsiderTransaction.findFirst({
      orderBy: { transactionDate: 'desc' },
      include: { company: true, owner: true },
    });
    
    if (latest) {
      console.log(`\n\n📅 Latest transaction in DB:`);
      console.log(`    Date: ${latest.transactionDate}`);
      console.log(`    Company: ${latest.company.ticker} - ${latest.company.name}`);
      console.log(`    Owner: ${latest.owner.name}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkNVCTTrade();
