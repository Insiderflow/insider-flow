#!/usr/bin/env node

/**
 * Manually import the NVCT trade from 2025-10-23
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function importNVCTTrade() {
  try {
    console.log('📥 Importing NVCT trade from 2025-10-23...');
    
    // Find or create company
    let company = await prisma.openInsiderCompany.findUnique({
      where: { ticker: 'NVCT' }
    });
    
    if (!company) {
      company = await prisma.openInsiderCompany.create({
        data: {
          ticker: 'NVCT',
          name: 'Nuvectis Pharma, Inc.',
        }
      });
      console.log('✅ Created company: NVCT');
    } else {
      console.log('✅ Found company: NVCT');
    }
    
    // Find or create owner
    let owner = await prisma.openInsiderOwner.findUnique({
      where: { name: 'Mosseri Marlio Charles' }
    });
    
    if (!owner) {
      owner = await prisma.openInsiderOwner.create({
        data: {
          name: 'Mosseri Marlio Charles',
          title: '10%',
          isInstitution: false,
        }
      });
      console.log('✅ Created owner: Mosseri Marlio Charles');
    } else {
      console.log('✅ Found owner: Mosseri Marlio Charles');
      // Update title if it changed
      if (owner.title !== '10%') {
        await prisma.openInsiderOwner.update({
          where: { id: owner.id },
          data: { title: '10%' }
        });
      }
    }
    
    // Check if transaction already exists
    const existing = await prisma.openInsiderTransaction.findFirst({
      where: {
        companyId: company.id,
        ownerId: owner.id,
        transactionDate: new Date('2025-10-23'),
        transactionType: 'P - Purchase',
      }
    });
    
    if (existing) {
      console.log('⚠️  Trade already exists in database');
      return;
    }
    
    // Create transaction
    const transaction = await prisma.openInsiderTransaction.create({
      data: {
        transactionDate: new Date('2025-10-23'),
        tradeDate: new Date('2025-10-23'),
        transactionType: 'P - Purchase',
        lastPrice: 6.18,
        quantity: '+154,770',
        sharesHeld: '3,245,897',
        owned: '+5%',
        value: '+$957,083',
        valueNumeric: 957083,
        companyId: company.id,
        ownerId: owner.id,
      }
    });
    
    console.log('✅ Successfully imported NVCT trade!');
    console.log(`   Transaction ID: ${transaction.id}`);
    console.log(`   Date: ${transaction.transactionDate}`);
    console.log(`   Type: ${transaction.transactionType}`);
    console.log(`   Value: ${transaction.value}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

importNVCTTrade()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
