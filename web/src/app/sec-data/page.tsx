import Link from 'next/link';
import { getSessionUser } from '@/lib/auth';
import { join } from 'path';

export const dynamic = 'force-dynamic';

type ManagerData = { 
  managerName: string;
  managerCik: string;
  holdingsCount: number;
  totalValue: number;
  avgPortfolioPct: number | null;
  buyCount: number;
  sellCount: number;
  newCount: number;
  holdCount: number;
  performance: string;
};

export default async function SECDataPage({ 
  searchParams 
}: { 
  searchParams: Promise<Record<string, string | string[] | undefined>> 
}) {
  const user = await getSessionUser();
  
  // Await searchParams for Next.js 15 compatibility
  const resolvedSearchParams = await searchParams;
  
  // Get sorting parameters
  const sortBy = resolvedSearchParams.sortBy as string || 'totalValue';
  const sortOrder = resolvedSearchParams.sortOrder as string || 'desc';
  
  // Initialize all variables at the top
  let managersData: ManagerData[] = [];
  let totalValue = 0;
  let uniqueManagers = 0;
  let uniqueIssuers = 0;
  let totalHoldings = 0;
  let totalPages = 1;
  let paginatedManagers: ManagerData[] = [];
  let highVolumeManagers = 0;
  let midVolumeManagers = 0;
  let lowVolumeManagers = 0;
  
  try {
    console.log('Connecting to SEC database...');
    
    // Use direct SQLite connection to your 1.3GB database
    const sqlite3 = await import('sqlite3').then(m => m.default).catch(() => null);
    if (!sqlite3) {
      throw new Error('SQLite3 not available');
    }
    const { verbose } = sqlite3;
    const dbPath = join(process.cwd(), '../../Corptracker/prisma/sec13f.db');
    
    console.log(`Database path: ${dbPath}`);
    
    // Get stats from your massive database using direct SQLite
    const db = new verbose.Database(dbPath);
    
    // Get counts
    const holdingsCount = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM holdings', (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });
    
    const managersCount = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM managers_summary', (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });
    
    const issuersCount = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM issuers_summary', (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });
    
    console.log(`Database stats: ${holdingsCount} holdings, ${managersCount} managers, ${issuersCount} issuers`);
    
    totalHoldings = holdingsCount as number;
    uniqueManagers = managersCount as number;
    uniqueIssuers = issuersCount as number;
    
    // FAST APPROACH - Use the optimized managers_summary table
    const page = Number(resolvedSearchParams.page) || 1;
    const itemsPerPage = 20;
    const offset = (page - 1) * itemsPerPage;
    
    // Get volume filter and apply it at database level
    const volumeFilter = resolvedSearchParams.volume as string || 'all';
    
    // Build WHERE clause based on volume filter
    let whereClause = '';
    if (volumeFilter === 'high') {
      whereClause = 'WHERE (buyCount + sellCount + newCount) >= 1000';
    } else if (volumeFilter === 'mid') {
      whereClause = 'WHERE (buyCount + sellCount + newCount) >= 100 AND (buyCount + sellCount + newCount) < 1000';
    } else if (volumeFilter === 'low') {
      whereClause = 'WHERE (buyCount + sellCount + newCount) < 100';
    }
    
    // Build ORDER BY clause based on sorting
    let orderByClause = 'ORDER BY totalValue DESC';
    if (sortBy === 'managerName') {
      orderByClause = `ORDER BY managerName ${sortOrder.toUpperCase()}`;
    } else if (sortBy === 'totalValue') {
      orderByClause = `ORDER BY totalValue ${sortOrder.toUpperCase()}`;
    } else if (sortBy === 'holdingsCount') {
      orderByClause = `ORDER BY holdingsCount ${sortOrder.toUpperCase()}`;
    } else if (sortBy === 'avgPortfolioPct') {
      orderByClause = `ORDER BY avgPortfolioPct ${sortOrder.toUpperCase()}`;
    } else if (sortBy === 'buyCount') {
      orderByClause = `ORDER BY buyCount ${sortOrder.toUpperCase()}`;
    } else if (sortBy === 'sellCount') {
      orderByClause = `ORDER BY sellCount ${sortOrder.toUpperCase()}`;
    }

    // Get managers from the optimized summary table with volume filtering
    const managers = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          managerName,
          managerCik,
          holdingsCount,
          totalValue,
          avgPortfolioPct,
          buyCount,
          sellCount,
          newCount,
          holdCount
        FROM managers_summary
        ${whereClause}
        ${orderByClause}
        LIMIT ? OFFSET ?
      `, [itemsPerPage, offset], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log(`Retrieved ${(managers as any[]).length} managers from database`);
    console.log('Sample manager data:', (managers as any[])[0]);
    
    // TEMPORARILY DISABLE P&L calculation for faster loading
    managersData = (managers as any[]).map(m => {
      const totalActivity = m.buyCount + m.sellCount + m.newCount + m.holdCount;
      const buyRatio = totalActivity > 0 ? (m.buyCount / totalActivity) * 100 : 0;
      const sellRatio = totalActivity > 0 ? (m.sellCount / totalActivity) * 100 : 0;
      
      return {
        managerName: m.managerName,
        managerCik: m.managerCik,
        holdingsCount: Number(m.holdingsCount),
        totalValue: Number(m.totalValue),
        avgPortfolioPct: m.avgPortfolioPct,
        buyCount: Number(m.buyCount),
        sellCount: Number(m.sellCount),
        newCount: Number(m.newCount),
        holdCount: Number(m.holdCount),
        performance: `${buyRatio.toFixed(1)}% Buy / ${sellRatio.toFixed(1)}% Sell`
      };
    });
    
    // Calculate total value from all managers
    totalValue = managersData.reduce((sum, row) => sum + row.totalValue, 0);
    
    console.log(`Total value from sample: $${totalValue.toLocaleString()}`);
    console.log(`Processed managersData length: ${managersData.length}`);
    console.log('Sample processed manager:', managersData[0]);
    
    // Get total count for pagination - Use the summary table for speed
    const totalManagersCount = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM managers_summary', (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });
    
    totalPages = Math.ceil((totalManagersCount as number) / itemsPerPage);

    // Get trade volume categories from the full database, not just current page
    const highVolumeCount = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM managers_summary WHERE (buyCount + sellCount + newCount) >= 1000', (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });
    
    const midVolumeCount = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM managers_summary WHERE (buyCount + sellCount + newCount) >= 100 AND (buyCount + sellCount + newCount) < 1000', (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });
    
    const lowVolumeCount = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM managers_summary WHERE (buyCount + sellCount + newCount) < 100', (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });
    
    highVolumeManagers = highVolumeCount as number;
    midVolumeManagers = midVolumeCount as number;
    lowVolumeManagers = lowVolumeCount as number;

    // Volume filtering is now done at database level
    paginatedManagers = managersData; // Already filtered and paginated from database
    
    console.log(`Final paginatedManagers length: ${paginatedManagers.length}`);
    console.log('Final paginated manager sample:', paginatedManagers[0]);
    
    db.close();
    
  } catch (error) {
    console.error('Error reading SEC data:', error);
    console.error('Error details:', error);
    // Fallback values are already set above
  }

  // Define variables that might be undefined after try/catch
  const volumeFilter = resolvedSearchParams.volume as string || 'all';
  const page = Number(resolvedSearchParams.page) || 1;
  
  // TEMPORARY: Add test data to see if table renders
  if (paginatedManagers.length === 0) {
    paginatedManagers = [
      {
        managerName: "Test Manager",
        managerCik: "123456",
        holdingsCount: 100,
        totalValue: 1000000000,
        avgPortfolioPct: 5.5,
        buyCount: 50,
        sellCount: 30,
        newCount: 20,
        holdCount: 0,
        performance: "50.0% Buy / 30.0% Sell"
      }
    ];
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <main className="p-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">SEC 13F 機構持股數據</h1>
          <p className="text-gray-400">查看機構投資者的持股詳情和投資組合分析</p>
          <div className="mt-2 p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
            <p className="text-green-400 text-sm">
              ✅ 使用真實 SEC 13F 申報數據 ({totalHoldings.toLocaleString()} 筆持股記錄)
            </p>
            <p className="text-green-400 text-xs mt-1">
              📊 資料庫大小: 1.3GB | 機構投資者: {uniqueManagers} | 投資公司: {uniqueIssuers}
            </p>
          </div>
        </div>
        
        {/* Debug Info */}
        <div className="mb-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">
            DEBUG: paginatedManagers.length = {paginatedManagers?.length || 'undefined'}
          </p>
          <p className="text-red-400 text-sm">
            DEBUG: totalPages = {totalPages}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="text-2xl font-bold text-orange-400">
              {uniqueManagers.toLocaleString()}
            </div>
            <div className="text-sm text-gray-400">機構投資者</div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="text-2xl font-bold text-orange-400">
              {totalHoldings.toLocaleString()}
            </div>
            <div className="text-sm text-gray-400">總持股數</div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="text-2xl font-bold text-orange-400">
              ${(totalValue / 1000000000).toFixed(1)}B
            </div>
            <div className="text-sm text-gray-400">前100大持股價值</div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="text-2xl font-bold text-orange-400">
              {uniqueIssuers.toLocaleString()}
            </div>
            <div className="text-sm text-gray-400">投資公司數</div>
          </div>
        </div>


        {/* Trade Volume Categories */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">📊 交易量分類</h2>
          <div className="grid grid-cols-3 gap-4">
            <Link
              href={`?volume=${volumeFilter === 'high' ? 'all' : 'high'}&page=1&sortBy=${sortBy}&sortOrder=${sortOrder}`}
              className={`rounded-lg p-4 transition-all duration-200 hover:scale-105 ${
                volumeFilter === 'high' 
                  ? 'bg-red-900/40 border-2 border-red-400' 
                  : 'bg-red-900/20 border border-red-500/30 hover:bg-red-900/30'
              }`}
            >
              <div className="text-2xl font-bold text-red-400">
                {highVolumeManagers}
              </div>
              <div className="text-sm text-gray-400">High trade volume (≥1000 holdings)</div>
            </Link>
              <Link
              href={`?volume=${volumeFilter === 'mid' ? 'all' : 'mid'}&page=1&sortBy=${sortBy}&sortOrder=${sortOrder}`}
              className={`rounded-lg p-4 transition-all duration-200 hover:scale-105 ${
                volumeFilter === 'mid' 
                  ? 'bg-yellow-900/40 border-2 border-yellow-400' 
                  : 'bg-yellow-900/20 border border-yellow-500/30 hover:bg-yellow-900/30'
              }`}
            >
              <div className="text-2xl font-bold text-yellow-400">
                {midVolumeManagers}
              </div>
              <div className="text-sm text-gray-400">Mid trade volume (100-999 holdings)</div>
            </Link>
              <Link
              href={`?volume=${volumeFilter === 'low' ? 'all' : 'low'}&page=1&sortBy=${sortBy}&sortOrder=${sortOrder}`}
              className={`rounded-lg p-4 transition-all duration-200 hover:scale-105 ${
                volumeFilter === 'low' 
                  ? 'bg-green-900/40 border-2 border-green-400' 
                  : 'bg-green-900/20 border border-green-500/30 hover:bg-green-900/30'
              }`}
            >
              <div className="text-2xl font-bold text-green-400">
                {lowVolumeManagers}
              </div>
              <div className="text-sm text-gray-400">Low trade volume (&lt;100 holdings)</div>
              </Link>
          </div>
        </div>

        {/* All Managers with Pagination */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">📊 所有機構投資者</h2>
            <div className="text-sm text-gray-400">
              第 {page} 頁，共 {totalPages} 頁 | 總計 {uniqueManagers.toLocaleString()} 個機構投資者
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-2 font-semibold text-gray-300">
                    <Link 
                      href={`?volume=${volumeFilter}&page=${page}&sortBy=managerName&sortOrder=${sortBy === 'managerName' && sortOrder === 'asc' ? 'desc' : 'asc'}`}
                      className="flex items-center hover:bg-gray-700 px-2 py-1 rounded transition-colors"
                    >
                      機構名稱
                      {sortBy === 'managerName' && (
                        <span className="ml-1 text-blue-400">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </Link>
                  </th>
                  <th className="text-right py-3 px-2 font-semibold text-gray-300">
                    <Link 
                      href={`?volume=${volumeFilter}&page=${page}&sortBy=totalValue&sortOrder=${sortBy === 'totalValue' && sortOrder === 'desc' ? 'asc' : 'desc'}`}
                      className="flex items-center justify-end hover:bg-gray-700 px-2 py-1 rounded transition-colors"
                    >
                      總價值
                      {sortBy === 'totalValue' && (
                        <span className="ml-1 text-blue-400">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </Link>
                  </th>
                  <th className="text-right py-3 px-2 font-semibold text-gray-300">
                    <Link 
                      href={`?volume=${volumeFilter}&page=${page}&sortBy=holdingsCount&sortOrder=${sortBy === 'holdingsCount' && sortOrder === 'desc' ? 'asc' : 'desc'}`}
                      className="flex items-center justify-end hover:bg-gray-700 px-2 py-1 rounded transition-colors"
                    >
                      持股數
                      {sortBy === 'holdingsCount' && (
                        <span className="ml-1 text-blue-400">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </Link>
                  </th>
                  <th className="text-right py-3 px-2 font-semibold text-gray-300">
                    <Link 
                      href={`?volume=${volumeFilter}&page=${page}&sortBy=avgPortfolioPct&sortOrder=${sortBy === 'avgPortfolioPct' && sortOrder === 'desc' ? 'asc' : 'desc'}`}
                      className="flex items-center justify-end hover:bg-gray-700 px-2 py-1 rounded transition-colors"
                    >
                      平均組合%
                      {sortBy === 'avgPortfolioPct' && (
                        <span className="ml-1 text-blue-400">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </Link>
                  </th>
                  <th className="text-center py-3 px-2 font-semibold text-gray-300">
                    <Link 
                      href={`?volume=${volumeFilter}&page=${page}&sortBy=buyCount&sortOrder=${sortBy === 'buyCount' && sortOrder === 'desc' ? 'asc' : 'desc'}`}
                      className="flex items-center justify-center hover:bg-gray-700 px-2 py-1 rounded transition-colors"
                    >
                      表現
                      {sortBy === 'buyCount' && (
                        <span className="ml-1 text-blue-400">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </Link>
                  </th>
                  <th className="text-center py-3 px-2 font-semibold text-gray-300">交易活動</th>
                  <th className="text-center py-3 px-2 font-semibold text-gray-300">CIK</th>
                </tr>
              </thead>
              <tbody>
                {paginatedManagers && paginatedManagers.length > 0 ? paginatedManagers.map((manager, index) => (
                  <tr key={index} className="border-b border-gray-700 hover:bg-gray-700/50">
                    <td className="py-3 px-2">
                      <Link 
                        href={`/sec-data/manager/${manager.managerCik}`}
                        className="text-blue-400 font-medium hover:text-blue-300 hover:underline transition-colors"
                      >
                        {manager.managerName}
                      </Link>
                    </td>
                    <td className="py-3 px-2 text-right text-gray-300">
                      ${(manager.totalValue / 1000000000).toFixed(1)}B
                      </td>
                      <td className="py-3 px-2 text-right text-gray-300">
                      {manager.holdingsCount.toLocaleString()}
                      </td>
                      <td className="py-3 px-2 text-right text-gray-300">
                      {manager.avgPortfolioPct?.toFixed(2) || 'N/A'}%
                      </td>
                      <td className="py-3 px-2 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        manager.performance.startsWith('+') 
                          ? 'bg-green-500 text-white' 
                          : manager.performance.startsWith('-')
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-500 text-white'
                      }`}>
                        {manager.performance}
                        </span>
                      </td>
                    <td className="py-3 px-2 text-center text-xs text-gray-400">
                      <div>買: {manager.buyCount}</div>
                      <div>賣: {manager.sellCount}</div>
                      <div>新: {manager.newCount}</div>
                      <div>持: {manager.holdCount}</div>
                    </td>
                    <td className="py-3 px-2 text-center text-xs text-gray-500">
                      {manager.managerCik}
                      </td>
                    </tr>
                )) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400">
                      No data available. Debug: paginatedManagers = {JSON.stringify(paginatedManagers)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex justify-center items-center mt-6 space-x-2">
                  <Link
              href={`?volume=${volumeFilter}&page=${Math.max(1, page - 1)}&sortBy=${sortBy}&sortOrder=${sortOrder}`}
              className={`px-3 py-2 rounded ${
                page <= 1 ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              上一頁
                  </Link>
            
            <div className="flex space-x-1">
              {(() => {
                const pages = [];
                const startPage = Math.max(1, page - 2);
                const endPage = Math.min(totalPages, page + 2);
                
                for (let i = startPage; i <= endPage; i++) {
                  pages.push(
                  <Link
                      key={`page-${i}`}
                      href={`?volume=${volumeFilter}&page=${i}&sortBy=${sortBy}&sortOrder=${sortOrder}`}
                      className={`px-3 py-2 rounded ${
                        i === page ? 'bg-blue-600 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'
                      }`}
                    >
                      {i}
                  </Link>
                  );
                }
                return pages;
              })()}
            </div>
            
            <Link 
              href={`?volume=${volumeFilter}&page=${Math.min(totalPages, page + 1)}&sortBy=${sortBy}&sortOrder=${sortOrder}`}
              className={`px-3 py-2 rounded ${
                page >= totalPages ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              下一頁
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">🚀 快速操作</h2>
          <div className="flex flex-wrap gap-4">
            <Link 
              href="/politicians" 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              查看政治人物交易
            </Link>
            <Link 
              href="/issuers" 
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              查看公司詳情
            </Link>
            <Link 
              href="/trades" 
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
            >
              查看所有交易
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}