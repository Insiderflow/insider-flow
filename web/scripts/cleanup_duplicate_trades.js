#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupDuplicateTrades() {
  try {
    console.log('🧹 Starting duplicate trades cleanup...');
    
    // First, get a count of total trades before cleanup
    const totalTradesBefore = await prisma.trade.count();
    console.log(`📊 Total trades before cleanup: ${totalTradesBefore.toLocaleString()}`);
    
    // Find exact duplicates (same politician, issuer, type, date, price)
    console.log('\n🔍 Finding exact duplicates...');
    const duplicateGroups = await prisma.$queryRaw`
      SELECT 
        politician_id,
        issuer_id,
        type,
        traded_at,
        price,
        COUNT(*) as duplicate_count,
        MIN(id) as keep_id,
        ARRAY_AGG(id ORDER BY created_at ASC) as all_ids
      FROM "Trade"
      GROUP BY politician_id, issuer_id, type, traded_at, price
      HAVING COUNT(*) > 1
      ORDER BY duplicate_count DESC
    `;
    
    console.log(`Found ${duplicateGroups.length} groups of exact duplicates`);
    
    if (duplicateGroups.length === 0) {
      console.log('✅ No exact duplicates found. Database is clean!');
      return;
    }
    
    // Show summary of duplicates to be removed
    let totalDuplicatesToRemove = 0;
    console.log('\n📋 Duplicate groups summary:');
    duplicateGroups.slice(0, 10).forEach((group, i) => {
      const duplicatesToRemove = Number(group.duplicate_count) - 1;
      totalDuplicatesToRemove += duplicatesToRemove;
      console.log(`${i+1}. ${group.politician_id} - ${group.type} - ${group.traded_at} - ${group.price} (${group.duplicate_count} total, ${duplicatesToRemove} to remove)`);
    });
    
    if (duplicateGroups.length > 10) {
      console.log(`... and ${duplicateGroups.length - 10} more groups`);
    }
    
    console.log(`\n📊 Total duplicates to remove: ${totalDuplicatesToRemove.toLocaleString()}`);
    
    // Ask for confirmation
    console.log('\n⚠️  This will permanently delete duplicate trades.');
    console.log('   Keeping the oldest record from each duplicate group.');
    console.log('   Proceeding with cleanup...');
    
    // Remove duplicates, keeping the oldest record (lowest ID)
    let removedCount = 0;
    const batchSize = 100;
    
    for (let i = 0; i < duplicateGroups.length; i += batchSize) {
      const batch = duplicateGroups.slice(i, i + batchSize);
      
      for (const group of batch) {
        // Get all IDs except the one to keep (oldest)
        const idsToDelete = group.all_ids.slice(1); // Remove first (oldest) ID
        
        if (idsToDelete.length > 0) {
          // Delete duplicates
          const deleteResult = await prisma.trade.deleteMany({
            where: {
              id: {
                in: idsToDelete
              }
            }
          });
          
          removedCount += Number(deleteResult.count);
          console.log(`✅ Removed ${deleteResult.count} duplicates for ${group.politician_id} - ${group.type} - ${group.traded_at}`);
        }
      }
      
      // Progress update
      const progress = Math.min(i + batchSize, duplicateGroups.length);
      console.log(`📈 Progress: ${progress}/${duplicateGroups.length} groups processed`);
    }
    
    // Get final count
    const totalTradesAfter = await prisma.trade.count();
    const actualRemoved = totalTradesBefore - totalTradesAfter;
    
    console.log('\n🎉 Cleanup completed!');
    console.log(`📊 Results:`);
    console.log(`   - Trades before: ${totalTradesBefore.toLocaleString()}`);
    console.log(`   - Trades after: ${totalTradesAfter.toLocaleString()}`);
    console.log(`   - Duplicates removed: ${actualRemoved.toLocaleString()}`);
    console.log(`   - Space saved: ${((actualRemoved / totalTradesBefore) * 100).toFixed(2)}%`);
    
    // Verify no duplicates remain
    console.log('\n🔍 Verifying cleanup...');
    const remainingDuplicates = await prisma.$queryRaw`
      SELECT 
        politician_id,
        issuer_id,
        type,
        traded_at,
        price,
        COUNT(*) as duplicate_count
      FROM "Trade"
      GROUP BY politician_id, issuer_id, type, traded_at, price
      HAVING COUNT(*) > 1
    `;
    
    if (remainingDuplicates.length === 0) {
      console.log('✅ Verification passed - no duplicates remain!');
    } else {
      console.log(`⚠️  Warning: ${remainingDuplicates.length} duplicate groups still exist`);
    }
    
    // Show some sample remaining trades
    console.log('\n📋 Sample remaining trades:');
    const sampleTrades = await prisma.trade.findMany({
      take: 5,
      include: {
        Politician: true,
        Issuer: true
      },
      orderBy: { created_at: 'desc' }
    });
    
    sampleTrades.forEach((trade, i) => {
      console.log(`${i+1}. ${trade.Politician?.name} - ${trade.type} - ${trade.Issuer?.name} (${trade.Issuer?.ticker}) - ${trade.traded_at} - $${trade.price}`);
    });
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupDuplicateTrades()
  .then(() => {
    console.log('\n✅ Cleanup script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Cleanup script failed:', error);
    process.exit(1);
  });
