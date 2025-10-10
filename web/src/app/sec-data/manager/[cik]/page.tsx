import Link from 'next/link';
import { getSessionUser } from '@/lib/auth';
import { join } from 'path';

export const dynamic = 'force-dynamic';

// Temporarily disable SEC data functionality in production
export default async function ManagerPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">Manager Details</h1>
        <p className="text-gray-300 mb-4">
          This feature is temporarily unavailable in production.
        </p>
        <Link href="/sec-data" className="text-blue-400 hover:text-blue-300">
          ← Back to SEC Data
        </Link>
      </div>
    </div>
  );
}

type ManagerDetail = {
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

type Holding = {
  issuerName: string;
  issuerCik: string;
  shares: number;
  value: number;
  portfolioPct: number | null;
  activity: string;
  shareChange: number;
  filingDate: string;
  createdAt: string;
};

export default async function ManagerPage({ 
  params,
  searchParams
}: { 
  params: Promise<{ cik: string }>,
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const user = await getSessionUser();
  const { cik } = await params;
  const resolvedSearchParams = await searchParams;
  
  // Get pagination and sorting parameters
  const page = Number(resolvedSearchParams.page) || 1;
  const itemsPerPage = 50;
  const offset = (page - 1) * itemsPerPage;
  const sortBy = (resolvedSearchParams.sortBy as string) || 'value';
  const sortOrder = (resolvedSearchParams.sortOrder as string) || 'desc';
  const startDate = (resolvedSearchParams.startDate as string) || '';
  const endDate = (resolvedSearchParams.endDate as string) || '';
  const activityFilter = ((resolvedSearchParams.activity as string) || 'all').toUpperCase();
  
  // Initialize variables
  let managerDetail: ManagerDetail | null = null;
  let holdings: Holding[] = [];
  let totalHoldings = 0;
  let uniqueIssuers = 0;
  let totalPages = 0;
  let pieSlices: { label: string; value: number; pct: number; color: string }[] = [];
  
  try {
    console.log(`Loading manager details for CIK: ${cik}`);
    
    // Connect to database
    const sqlite3 = await import('sqlite3').then(m => m.default).catch(() => null);
    if (!sqlite3) {
      throw new Error('SQLite3 not available');
    }
    const { verbose } = sqlite3;
    const dbPath = join(process.cwd(), '../../Corptracker/prisma/sec13f.db');
    const db = new verbose.Database(dbPath);
    
    // Get manager details from summary table
    const manager = await new Promise((resolve, reject) => {
      db.get(`
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
        WHERE managerCik = ?
      `, [cik], (err: any, row: any) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (manager) {
      const totalActivity = (manager as any).buyCount + (manager as any).sellCount + (manager as any).newCount + (manager as any).holdCount;
      const buyRatio = totalActivity > 0 ? ((manager as any).buyCount / totalActivity) * 100 : 0;
      const sellRatio = totalActivity > 0 ? ((manager as any).sellCount / totalActivity) * 100 : 0;
      
      managerDetail = {
        managerName: (manager as any).managerName,
        managerCik: (manager as any).managerCik,
        holdingsCount: Number((manager as any).holdingsCount),
        totalValue: Number((manager as any).totalValue),
        avgPortfolioPct: (manager as any).avgPortfolioPct,
        buyCount: Number((manager as any).buyCount),
        sellCount: Number((manager as any).sellCount),
        newCount: Number((manager as any).newCount),
        holdCount: Number((manager as any).holdCount),
        performance: `${buyRatio.toFixed(1)}% Buy / ${sellRatio.toFixed(1)}% Sell`
      };
      
      console.log(`Found manager: ${managerDetail.managerName}`);
      
      // Build ORDER BY clause based on sorting
      let orderByClause = 'ORDER BY value DESC';
      if (sortBy === 'issuerName') {
        orderByClause = `ORDER BY issuerName ${sortOrder.toUpperCase()}`;
      } else if (sortBy === 'value') {
        orderByClause = `ORDER BY value ${sortOrder.toUpperCase()}`;
      } else if (sortBy === 'shares') {
        orderByClause = `ORDER BY sharesOwned ${sortOrder.toUpperCase()}`;
      } else if (sortBy === 'portfolioPct') {
        orderByClause = `ORDER BY portfolioPct ${sortOrder.toUpperCase()}`;
      } else if (sortBy === 'activity') {
        orderByClause = `ORDER BY latestActivity ${sortOrder.toUpperCase()}`;
      } else if (sortBy === 'filingDate') {
        orderByClause = `ORDER BY filingDate ${sortOrder.toUpperCase()}`;
      }

      // Build WHERE filters
      const whereParts: string[] = ['managerCik = ?', "latestActivity IN ('BUY','SELL')"];
      const whereParams: any[] = [cik];
      if (startDate) {
        whereParts.push('createdAt >= ?');
        whereParams.push(startDate);
      }
      if (endDate) {
        whereParts.push('createdAt <= ?');
        whereParams.push(endDate);
      }
      if (activityFilter && activityFilter !== 'ALL') {
        // Map to BUY/SELL only; treat anything else as null filter
        const allowed = ['BUY', 'SELL'];
        if (allowed.includes(activityFilter)) {
          whereParts.push('latestActivity = ?');
          whereParams.push(activityFilter);
        }
      }
      const whereClause = `WHERE ${whereParts.join(' AND ')}`;

      // Get holdings for this manager with pagination and sorting
      const managerHoldings = await new Promise((resolve, reject) => {
        db.all(`
          SELECT 
            issuerName,
            cusip,
            ticker,
            sharesOwned as shares,
            value,
            portfolioPct,
            latestActivity as activity,
            tradeValue as shareChange,
            filingDate,
            createdAt
          FROM holdings
          ${whereClause}
          ${orderByClause}
          LIMIT ? OFFSET ?
        `, [...whereParams, itemsPerPage, offset], (err: any, rows: any) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
      
      holdings = (managerHoldings as any[]).map(h => ({
        issuerName: h.issuerName,
        issuerCik: h.cusip, // Use CUSIP as identifier
        shares: Number(h.shares),
        value: Number(h.value),
        portfolioPct: h.portfolioPct,
        activity: h.activity,
        shareChange: Number(h.shareChange),
        filingDate: h.filingDate,
        createdAt: h.createdAt
      }));
      
      // Get filtered counts
      const holdingsCount = await new Promise((resolve, reject) => {
        db.get(`SELECT COUNT(*) as count FROM holdings ${whereClause}`, whereParams, (err: any, row: any) => {
          if (err) reject(err);
          else resolve(row.count);
        });
      });
      
      const issuersCount = await new Promise((resolve, reject) => {
        db.get(`SELECT COUNT(DISTINCT issuerName) as count FROM holdings ${whereClause}`, whereParams, (err: any, row: any) => {
          if (err) reject(err);
          else resolve(row.count);
        });
      });
      
      totalHoldings = holdingsCount as number;
      uniqueIssuers = issuersCount as number;
      totalPages = Math.ceil(totalHoldings / itemsPerPage);

      // Build aggregated slices for pie chart (top 10 + other) based on total value per issuer across ALL holdings for this manager
      const aggregated = await new Promise((resolve, reject) => {
        db.all(`
          SELECT issuerName, SUM(value) as totalValue
          FROM holdings
          WHERE managerCik = ? AND latestActivity IN ('BUY','SELL')
          GROUP BY issuerName
          ORDER BY totalValue DESC
        `, [cik], (err: any, rows: any[]) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });

      const aggRows = aggregated as { issuerName: string; totalValue: number }[];
      const grandTotal = aggRows.reduce((s, r) => s + Number(r.totalValue || 0), 0) || 1;
      const top = aggRows.slice(0, 10).map((r, idx) => ({
        label: r.issuerName,
        value: Number(r.totalValue || 0),
        pct: (Number(r.totalValue || 0) / grandTotal) * 100,
        color: `hsl(${idx * 36}, 70%, 50%)`
      }));
      const otherValue = aggRows.slice(10).reduce((s, r) => s + Number(r.totalValue || 0), 0);
      const otherSlice = otherValue > 0 ? [{
        label: '其他',
        value: otherValue,
        pct: (otherValue / grandTotal) * 100,
        color: 'hsl(0, 0%, 35%)'
      }] : [];
      pieSlices = [...top, ...otherSlice];
    }
    
    db.close();
    
  } catch (error) {
    console.error('Error loading manager details:', error);
  }
  
  if (!managerDetail) {
    return (
      <div className="min-h-screen bg-gray-900">
        <main className="p-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 mb-6">
              <h1 className="text-2xl font-bold text-red-400 mb-2">Manager Not Found</h1>
              <p className="text-gray-400">The manager with CIK {cik} could not be found in our database.</p>
            </div>
            <Link 
              href="/sec-data"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              ← Back to SEC Data
            </Link>
          </div>
        </main>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-900">
      <main className="p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">{managerDetail.managerName}</h1>
                <p className="text-gray-400">CIK: {managerDetail.managerCik}</p>
              </div>
              <Link 
                href="/sec-data"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                ← Back to SEC Data
              </Link>
            </div>
            
            {/* Manager Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="text-2xl font-bold text-orange-400">
                  ${(managerDetail.totalValue / 1000000000).toFixed(1)}B
                </div>
                <div className="text-sm text-gray-400">總價值</div>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="text-2xl font-bold text-orange-400">
                  {totalHoldings.toLocaleString()}
                </div>
                <div className="text-sm text-gray-400">總持股數</div>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="text-2xl font-bold text-orange-400">
                  {uniqueIssuers.toLocaleString()}
                </div>
                <div className="text-sm text-gray-400">投資公司數</div>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="text-2xl font-bold text-orange-400">
                  {managerDetail.avgPortfolioPct?.toFixed(2) || 'N/A'}%
                </div>
                <div className="text-sm text-gray-400">平均組合%</div>
              </div>
            </div>
            
            {/* Trading Activity */}
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-bold text-white mb-4">📊 交易活動</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{managerDetail.buyCount.toLocaleString()}</div>
                  <div className="text-sm text-gray-400">買入交易</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-400">{managerDetail.sellCount.toLocaleString()}</div>
                  <div className="text-sm text-gray-400">賣出交易</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{managerDetail.newCount.toLocaleString()}</div>
                  <div className="text-sm text-gray-400">新建倉位</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">{managerDetail.holdCount.toLocaleString()}</div>
                  <div className="text-sm text-gray-400">持有倉位</div>
                </div>
              </div>
              <div className="mt-4 text-center">
                <span className="px-3 py-1 bg-gray-700 text-white rounded-full text-sm">
                  {managerDetail.performance}
                </span>
              </div>
            </div>
          </div>

          {/* Filters */}
          <form className="bg-gray-800 rounded-lg p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">發布日期 從</label>
              <input
                type="date"
                name="startDate"
                defaultValue={startDate}
                className="w-full bg-gray-900 text-white rounded px-3 py-2 border border-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">發布日期 到</label>
              <input
                type="date"
                name="endDate"
                defaultValue={endDate}
                className="w-full bg-gray-900 text-white rounded px-3 py-2 border border-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">交易類型</label>
              <select
                name="activity"
                defaultValue={activityFilter.toLowerCase()}
                className="w-full bg-gray-900 text-white rounded px-3 py-2 border border-gray-700"
              >
                <option value="all">全部</option>
                <option value="buy">買入</option>
                <option value="sell">賣出</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                套用篩選
              </button>
            </div>
            {/* Preserve existing params */}
            <input type="hidden" name="sortBy" value={sortBy} />
            <input type="hidden" name="sortOrder" value={sortOrder} />
            <input type="hidden" name="page" value={page} />
          </form>
          
      {/* Portfolio Pie Chart */}
      {pieSlices.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">🧩 組合分佈</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
            {/* Pie */}
            <div className="flex items-center justify-center">
              {(() => {
                // Build conic-gradient stops
                let acc = 0;
                const stops = pieSlices.map(s => {
                  const start = acc;
                  const end = acc + s.pct;
                  acc = end;
                  return `${s.color} ${start.toFixed(2)}% ${end.toFixed(2)}%`;
                }).join(', ');
                const bg = `conic-gradient(${stops})`;
                return (
                  <div className="relative" style={{ width: 260, height: 260 }}>
                    <div className="rounded-full" style={{ width: 260, height: 260, background: bg }}></div>
                    <div className="absolute inset-0 m-auto rounded-full bg-gray-900" style={{ width: 120, height: 120 }}></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-lg text-gray-300">前10 + 其他</div>
                        <div className="text-2xl font-semibold text-white">100%</div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
            {/* Legend */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {pieSlices.map((s, i) => (
                <div key={`slice-${i}`} className="flex items-center">
                  <div className="w-3 h-3 rounded mr-3" style={{ backgroundColor: s.color }}></div>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-white truncate" title={s.label}>{s.label}</span>
                      <span className="text-gray-300">{s.pct.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}


                {/* Top Holdings */}
                <div className="bg-gray-800 rounded-lg p-6">
                  <h2 className="text-xl font-bold text-white mb-4">🏢 主要持股</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-2 font-semibold text-gray-300">
                      <Link
                        href={`?page=${page}&sortBy=issuerName&sortOrder=${sortBy === 'issuerName' && sortOrder === 'asc' ? 'desc' : 'asc'}&startDate=${startDate}&endDate=${endDate}&activity=${activityFilter.toLowerCase()}`}
                        className="flex items-center hover:bg-gray-700 px-2 py-1 rounded transition-colors"
                      >
                        公司名稱
                        {sortBy === 'issuerName' && (
                          <span className="ml-1 text-blue-400">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </Link>
                    </th>
                    <th className="text-right py-3 px-2 font-semibold text-gray-300">
                      <Link
                        href={`?page=${page}&sortBy=value&sortOrder=${sortBy === 'value' && sortOrder === 'asc' ? 'desc' : 'asc'}&startDate=${startDate}&endDate=${endDate}&activity=${activityFilter.toLowerCase()}`}
                        className="flex items-center justify-end hover:bg-gray-700 px-2 py-1 rounded transition-colors"
                      >
                        價值
                        {sortBy === 'value' && (
                          <span className="ml-1 text-blue-400">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </Link>
                    </th>
                    <th className="text-right py-3 px-2 font-semibold text-gray-300">
                      <Link
                        href={`?page=${page}&sortBy=shares&sortOrder=${sortBy === 'shares' && sortOrder === 'asc' ? 'desc' : 'asc'}&startDate=${startDate}&endDate=${endDate}&activity=${activityFilter.toLowerCase()}`}
                        className="flex items-center justify-end hover:bg-gray-700 px-2 py-1 rounded transition-colors"
                      >
                        股數
                        {sortBy === 'shares' && (
                          <span className="ml-1 text-blue-400">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </Link>
                    </th>
                    <th className="text-right py-3 px-2 font-semibold text-gray-300">
                      <Link
                        href={`?page=${page}&sortBy=portfolioPct&sortOrder=${sortBy === 'portfolioPct' && sortOrder === 'asc' ? 'desc' : 'asc'}&startDate=${startDate}&endDate=${endDate}&activity=${activityFilter.toLowerCase()}`}
                        className="flex items-center justify-end hover:bg-gray-700 px-2 py-1 rounded transition-colors"
                      >
                        組合%
                        {sortBy === 'portfolioPct' && (
                          <span className="ml-1 text-blue-400">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </Link>
                    </th>
                    <th className="text-center py-3 px-2 font-semibold text-gray-300">
                      <Link
                        href={`?page=${page}&sortBy=activity&sortOrder=${sortBy === 'activity' && sortOrder === 'asc' ? 'desc' : 'asc'}&startDate=${startDate}&endDate=${endDate}&activity=${activityFilter.toLowerCase()}`}
                        className="flex items-center justify-center hover:bg-gray-700 px-2 py-1 rounded transition-colors"
                      >
                        活動
                        {sortBy === 'activity' && (
                          <span className="ml-1 text-blue-400">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </Link>
                    </th>
                    <th className="text-right py-3 px-2 font-semibold text-gray-300">股數變化</th>
                    <th className="text-center py-3 px-2 font-semibold text-gray-300">
                      <Link
                        href={`?page=${page}&sortBy=filingDate&sortOrder=${sortBy === 'filingDate' && sortOrder === 'asc' ? 'desc' : 'asc'}&startDate=${startDate}&endDate=${endDate}&activity=${activityFilter.toLowerCase()}`}
                        className="flex items-center justify-center hover:bg-gray-700 px-2 py-1 rounded transition-colors"
                      >
                        申報日期
                        {sortBy === 'filingDate' && (
                          <span className="ml-1 text-blue-400">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </Link>
                    </th>
                    <th className="text-center py-3 px-2 font-semibold text-gray-300">發布日期</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((holding, index) => (
                    <tr key={index} className="border-b border-gray-700 hover:bg-gray-700/50">
                      <td className="py-3 px-2">
                        <div className="font-medium text-white">{holding.issuerName}</div>
                        <div className="text-xs text-gray-400">CUSIP: {holding.issuerCik}</div>
                      </td>
                      <td className="py-3 px-2 text-right text-gray-300">
                        ${(holding.value / 1000000).toFixed(1)}M
                      </td>
                      <td className="py-3 px-2 text-right text-gray-300">
                        {holding.shares.toLocaleString()}
                      </td>
                      <td className="py-3 px-2 text-right text-gray-300">
                        {holding.portfolioPct?.toFixed(2) || 'N/A'}%
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          holding.activity === 'BUY' ? 'bg-green-500 text-white' :
                          holding.activity === 'SELL' ? 'bg-red-500 text-white' :
                          holding.activity === 'NEW' ? 'bg-blue-500 text-white' :
                          'bg-gray-500 text-white'
                        }`}>
                          {holding.activity}
                        </span>
                      </td>
                      <td className={`py-3 px-2 text-right font-medium ${
                        holding.shareChange > 0 ? 'text-green-400' :
                        holding.shareChange < 0 ? 'text-red-400' :
                        'text-gray-400'
                      }`}>
                        {holding.shareChange > 0 ? '+' : ''}{holding.shareChange.toLocaleString()}
                      </td>
                      <td className="py-3 px-2 text-center text-gray-300">
                        {holding.filingDate ? new Date(holding.filingDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3 px-2 text-center text-gray-300">
                        {holding.createdAt ? new Date(holding.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {holdings.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                No holdings data available for this manager.
              </div>
            )}
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-6 space-x-2">
                <Link
                  href={`?page=${Math.max(1, page - 1)}&sortBy=${sortBy}&sortOrder=${sortOrder}&startDate=${startDate}&endDate=${endDate}&activity=${activityFilter.toLowerCase()}`}
                  className={`px-3 py-2 rounded ${
                    page <= 1 ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-gray-700 text-white hover:bg-gray-600'
                  }`}
                >
                  上一頁
                </Link>
                
                <div className="flex space-x-1">
                  {(() => {
                    const startPage = Math.max(1, page - 2);
                    const endPage = Math.min(totalPages, page + 2);
                    const pages = [];
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(
                        <Link
                          key={`page-${i}`}
                          href={`?page=${i}&sortBy=${sortBy}&sortOrder=${sortOrder}&startDate=${startDate}&endDate=${endDate}&activity=${activityFilter.toLowerCase()}`}
                          className={`px-3 py-2 rounded ${
                            i === page 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-gray-700 text-white hover:bg-gray-600'
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
                  href={`?page=${Math.min(totalPages, page + 1)}&sortBy=${sortBy}&sortOrder=${sortOrder}&startDate=${startDate}&endDate=${endDate}&activity=${activityFilter.toLowerCase()}`}
                  className={`px-3 py-2 rounded ${
                    page >= totalPages ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-gray-700 text-white hover:bg-gray-600'
                  }`}
                >
                  下一頁
                </Link>
              </div>
            )}
            
            {/* Page info */}
            <div className="text-center mt-4 text-gray-400 text-sm">
              顯示第 {((page - 1) * itemsPerPage) + 1} - {Math.min(page * itemsPerPage, totalHoldings)} 項，共 {totalHoldings.toLocaleString()} 項持股
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
