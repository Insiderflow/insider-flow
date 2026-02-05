#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listAllPoliticians() {
  try {
    console.log('📊 Fetching all politicians from database...\n');
    
    const politicians = await prisma.politician.findMany({
      include: {
        _count: {
          select: { Trade: true }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    console.log(`Found ${politicians.length} total politicians\n`);
    console.log('═'.repeat(100));
    console.log('ALL POLITICIANS IN DATABASE:\n');
    
    politicians.forEach((politician, index) => {
      console.log(`${(index + 1).toString().padStart(4, ' ')}. ${politician.name}`);
      console.log(`     Party: ${politician.party || 'N/A'} | Chamber: ${politician.chamber || 'N/A'} | State: ${politician.state || 'N/A'}`);
      console.log(`     ID: ${politician.id} | Total Trades: ${politician._count.Trade}`);
      console.log('');
    });
    
    console.log('═'.repeat(100));
    console.log(`\nTotal: ${politicians.length} politicians`);
    
    // Summary by party
    const partyCounts = {};
    const chamberCounts = {};
    
    politicians.forEach(p => {
      partyCounts[p.party || 'Unknown'] = (partyCounts[p.party || 'Unknown'] || 0) + 1;
      chamberCounts[p.chamber || 'Unknown'] = (chamberCounts[p.chamber || 'Unknown'] || 0) + 1;
    });
    
    console.log('\n📊 Summary by Party:');
    Object.entries(partyCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([party, count]) => {
        console.log(`   ${party}: ${count}`);
      });
    
    console.log('\n📊 Summary by Chamber:');
    Object.entries(chamberCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([chamber, count]) => {
        console.log(`   ${chamber}: ${count}`);
      });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listAllPoliticians().catch(console.error);





