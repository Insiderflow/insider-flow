import { prisma } from '@/lib/prisma';
import PoliticianCard from '@/components/PoliticianCard';
import LastUpdated, { DataFreshnessIndicator } from '@/components/LastUpdated';
import { getCurrentUserWithTier, isPaid } from '@/lib/membership';
import { redirect } from 'next/navigation';
import fs from 'fs';
import path from 'path';
import StateNotice from '@/components/StateNotice';
import Link from 'next/link';
import PoliticianProfileImage from '@/components/PoliticianProfileImage';
import { actionStyles } from '@/components/actionStyles';
import { fieldControlStyles, fieldLabelStyles } from '@/components/formStyles';
import { statSurfaceStyles } from '@/components/surfaceStyles';
import { mutedLabelStyles, pageTitleStyles } from '@/components/typographyStyles';
export const dynamic = 'force-dynamic';

type Row = { id: string; name: string; party: string | null; chamber: string | null; trades: number; issuers: number; volume: number; lastTraded: Date | null; performance?: number };

export default async function PoliticiansPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const me = await getCurrentUserWithTier();
  if (!isPaid(me)) {
    redirect('/upgrade?reason=paid_required');
  }
  const chamber = typeof sp.chamber === 'string' ? sp.chamber : '';
  const searchName = typeof sp.name === 'string' ? sp.name : '';
  const allowedSort = new Set(['name', 'trades', 'issuers', 'volume', 'performance', 'portfolio']);
  const sortKeyRaw = typeof sp.sort === 'string' ? sp.sort : 'trades';
  const sortKey = allowedSort.has(sortKeyRaw) ? sortKeyRaw : 'trades';
  const order = (typeof sp.order === 'string' && sp.order.toLowerCase() === 'asc') ? 'asc' : 'desc';
  const whereChamber = (chamber === 'House' || chamber === 'Senate') ? chamber : null;
  
  // Pagination parameters
  const pageSize = 20;
  const page = Math.max(1, Number(typeof sp.page === 'string' ? sp.page : 1) || 1);

  // Get total count for pagination
  const totalPoliticians = await prisma.politician.count({
    where: {
      ...(whereChamber ? { chamber: whereChamber } : {}),
      ...(searchName ? { name: { contains: searchName, mode: 'insensitive' } } : {})
    }
  });

  // Load portfolio cache for performance and portfolio sorting
  let portfolioCache: Map<string, { politician_name?: string; data?: { politician_returns: number[]; sp500_returns: number[] } }> = new Map();
  if (sortKey === 'performance' || sortKey === 'portfolio') {
    try {
      const cachePath = path.join(process.cwd(), 'portfolio_cache.json');
      if (fs.existsSync(cachePath)) {
        const cacheData = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
        portfolioCache = new Map(Object.entries(cacheData));
      }
    } catch (error) {
      console.error('Error loading portfolio cache:', error);
    }
  }

  // Helper function to calculate performance vs S&P 500
  const getPerformance = (politicianId: string, politicianName: string): number => {
    // Try to find by ID first
    let cacheEntry = portfolioCache.get(politicianId);
    
    // If not found by ID, search by name
    if (!cacheEntry) {
      for (const [, data] of portfolioCache.entries()) {
        if (data.politician_name?.toLowerCase() === politicianName.toLowerCase()) {
          cacheEntry = data;
          break;
        }
      }
    }
    
    if (!cacheEntry?.data) return 0;
    
    const { politician_returns, sp500_returns } = cacheEntry.data;
    
    // Find last non-zero return for politician
    let latestPoliticianReturn = 0;
    for (let i = politician_returns.length - 1; i >= 0; i--) {
      if (politician_returns[i] !== 0) {
        latestPoliticianReturn = politician_returns[i];
        break;
      }
    }
    
    // Get last S&P 500 return
    const latestSp500Return = sp500_returns[sp500_returns.length - 1] || 0;
    
    // Calculate outperformance
    return latestPoliticianReturn - latestSp500Return;
  };

  // Helper function to get portfolio return (actual return, not vs S&P 500)
  const getPortfolioReturn = (politicianId: string, politicianName: string): number => {
    // Try to find by ID first
    let cacheEntry = portfolioCache.get(politicianId);
    
    // If not found by ID, search by name
    if (!cacheEntry) {
      for (const [, data] of portfolioCache.entries()) {
        if (data.politician_name?.toLowerCase() === politicianName.toLowerCase()) {
          cacheEntry = data;
          break;
        }
      }
    }
    
    if (!cacheEntry?.data) return 0;
    
    const { politician_returns } = cacheEntry.data;
    
    // Find last non-zero return for politician (this is the actual portfolio return)
    for (let i = politician_returns.length - 1; i >= 0; i--) {
      if (politician_returns[i] !== 0) {
        return politician_returns[i];
      }
    }
    
    return 0;
  };

  // Get politicians with their stats, sorted by the requested field
  let politicians;
  
  if (sortKey === 'performance') {
    // For performance sorting, load all politicians, calculate performance, then sort
    const allPoliticians = await prisma.politician.findMany({
      where: {
        ...(whereChamber ? { chamber: whereChamber } : {}),
        ...(searchName ? { name: { contains: searchName, mode: 'insensitive' } } : {})
      },
      include: {
        _count: {
          select: {
            Trade: true
          }
        }
      }
    });
    
    // Calculate performance for each politician and sort
    const politiciansWithPerformance = allPoliticians.map(p => ({
      ...p,
      performance: getPerformance(p.id, p.name)
    }));
    
    const sortedPoliticians = politiciansWithPerformance.sort((a, b) => {
      return order === 'asc' ? a.performance - b.performance : b.performance - a.performance;
    });
    
    politicians = sortedPoliticians.slice((page - 1) * pageSize, page * pageSize);
  } else if (sortKey === 'portfolio') {
    // For portfolio sorting, load all politicians, calculate portfolio return, then sort
    const allPoliticians = await prisma.politician.findMany({
      where: {
        ...(whereChamber ? { chamber: whereChamber } : {}),
        ...(searchName ? { name: { contains: searchName, mode: 'insensitive' } } : {})
      },
      include: {
        _count: {
          select: {
            Trade: true
          }
        }
      }
    });
    
    // Calculate portfolio return for each politician and sort
    const politiciansWithPortfolio = allPoliticians.map(p => ({
      ...p,
      portfolioReturn: getPortfolioReturn(p.id, p.name)
    }));
    
    const sortedPoliticians = politiciansWithPortfolio.sort((a, b) => {
      return order === 'asc' ? a.portfolioReturn - b.portfolioReturn : b.portfolioReturn - a.portfolioReturn;
    });
    
    politicians = sortedPoliticians.slice((page - 1) * pageSize, page * pageSize);
  } else if (sortKey === 'volume') {
    // For volume sorting, we need to calculate volume first, then sort
    const allPoliticians = await prisma.politician.findMany({
      where: {
        ...(whereChamber ? { chamber: whereChamber } : {}),
        ...(searchName ? { name: { contains: searchName, mode: 'insensitive' } } : {})
      },
      include: {
        _count: {
          select: {
            Trade: true
          }
        }
      }
    });
    
    // Get volume data for all politicians
    const politicianIds = allPoliticians.map(p => p.id);
    const volumeData = await prisma.trade.groupBy({
      by: ['politician_id'],
      where: {
        politician_id: { in: politicianIds }
      },
      _sum: {
        size_min: true,
        size_max: true
      }
    });
    
    // Create volume map
    const volumeMap = new Map<string, number>();
    volumeData.forEach(vol => {
      const avgSize = vol._sum.size_min && vol._sum.size_max ? 
        (Number(vol._sum.size_min) + Number(vol._sum.size_max)) / 2 : 0;
      volumeMap.set(vol.politician_id, avgSize);
    });
    
    // Sort by volume and apply pagination
    const sortedPoliticians = allPoliticians.sort((a, b) => {
      const aVol = volumeMap.get(a.id) || 0;
      const bVol = volumeMap.get(b.id) || 0;
      return order === 'asc' ? aVol - bVol : bVol - aVol;
    });
    
    politicians = sortedPoliticians.slice((page - 1) * pageSize, page * pageSize);
  } else {
    // For other sorting fields, use database sorting
    const orderBy: Record<string, unknown> = {};
    if (sortKey === 'trades') {
      orderBy.Trade = { _count: order };
    } else if (sortKey === 'name') {
      orderBy.name = order;
    }
    
    politicians = await prisma.politician.findMany({
      where: {
        ...(whereChamber ? { chamber: whereChamber } : {}),
        ...(searchName ? { name: { contains: searchName, mode: 'insensitive' } } : {})
      },
      include: {
        _count: {
          select: {
            Trade: true
          }
        }
      },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize
    });
  }

  // Get last trade dates for each politician
  const politicianIds = politicians.map(p => p.id);
  const lastTradeDates = await prisma.trade.findMany({
    where: {
      politician_id: { in: politicianIds }
    },
    select: {
      politician_id: true,
      traded_at: true
    },
    orderBy: {
      traded_at: 'desc'
    }
  });

  // Create a map of politician_id to last trade date
  const lastTradeMap = new Map<string, Date>();
  lastTradeDates.forEach(trade => {
    if (!lastTradeMap.has(trade.politician_id)) {
      lastTradeMap.set(trade.politician_id, trade.traded_at);
    }
  });

  // Get issuer counts for each politician
  const issuerCounts = await prisma.trade.groupBy({
    by: ['politician_id'],
    where: {
      politician_id: { in: politicianIds }
    },
    _count: {
      issuer_id: true
    }
  });

  // Create a map of politician_id to issuer count
  const issuerCountMap = new Map<string, number>();
  issuerCounts.forEach(count => {
    issuerCountMap.set(count.politician_id, count._count.issuer_id);
  });

  // Get volume data for each politician (only if not already calculated for volume sorting)
  const volumeMap = new Map<string, number>();
  if (sortKey !== 'volume') {
    const volumeData = await prisma.trade.groupBy({
      by: ['politician_id'],
      where: {
        politician_id: { in: politicianIds }
      },
      _sum: {
        size_min: true,
        size_max: true
      }
    });

    // Create a map of politician_id to volume
    volumeData.forEach(vol => {
      const avgSize = vol._sum.size_min && vol._sum.size_max ? 
        (Number(vol._sum.size_min) + Number(vol._sum.size_max)) / 2 : 0;
      volumeMap.set(vol.politician_id, avgSize);
    });
  }

  // Transform to the expected format (optimized - no trade data loaded)
  const rows: Row[] = politicians.map(politician => {
    let performance = 0;
    if (sortKey === 'performance' && 'performance' in politician) {
      performance = (politician as typeof politician & { performance: number }).performance;
    } else if (sortKey === 'portfolio' && 'portfolioReturn' in politician) {
      // For portfolio sorting, we still calculate performance for display, but sorting was done by portfolio return
      performance = getPerformance(politician.id, politician.name);
    } else {
      performance = getPerformance(politician.id, politician.name);
    }
    
    return {
      id: politician.id,
      name: politician.name,
      party: politician.party,
      chamber: politician.chamber,
      trades: politician._count.Trade,
      issuers: issuerCountMap.get(politician.id) || 0,
      volume: volumeMap.get(politician.id) || 0,
      lastTraded: lastTradeMap.get(politician.id) || null,
      performance
    };
  });
  const topByVolumePoliticians = [...rows]
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 5);
  const [tradeCount, polCount, issuerCount, lastTradeDate] = await Promise.all([
    prisma.trade.count(),
    prisma.politician.count(),
    prisma.issuer.count(),
    prisma.trade.findFirst({
      orderBy: { traded_at: 'desc' },
      select: { traded_at: true }
    }).then(result => result?.traded_at || new Date())
  ]);
  return (
    <div className="min-h-screen bg-gray-900">
      <main className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className={pageTitleStyles()}>
            <span className="zh-Hant">政治家</span>
            <span className="zh-Hans hidden">政治家</span>
          </h1>
          <div className="flex items-center gap-4">
            <div className={`text-sm ${mutedLabelStyles()}`}>
              <span className="zh-Hant">顯示 {totalPoliticians} 位政治家 (第 {page} 頁，共 {Math.ceil(totalPoliticians / pageSize)} 頁)</span>
              <span className="zh-Hans hidden">显示 {totalPoliticians} 位政治家 (第 {page} 页，共 {Math.ceil(totalPoliticians / pageSize)} 页)</span>
            </div>
            <div className="flex items-center gap-2">
              <DataFreshnessIndicator timestamp={lastTradeDate} />
              <LastUpdated timestamp={lastTradeDate} className="text-xs text-gray-400" />
            </div>
          </div>
        </div>
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className={statSurfaceStyles()}>
            <div className="text-xs text-white">
              <span className="zh-Hant">交易</span>
              <span className="zh-Hans hidden">交易</span>
            </div>
            <div className="text-lg sm:text-xl font-semibold text-white">{tradeCount}</div>
          </div>
          <div className={statSurfaceStyles()}>
            <div className="text-xs text-white">
              <span className="zh-Hant">政治家</span>
              <span className="zh-Hans hidden">政治家</span>
            </div>
            <div className="text-lg sm:text-xl font-semibold text-white">{polCount}</div>
          </div>
          <div className={statSurfaceStyles()}>
            <div className="text-xs text-white">
              <span className="zh-Hant">發行商</span>
              <span className="zh-Hans hidden">发行商</span>
            </div>
            <div className="text-lg sm:text-xl font-semibold text-white">{issuerCount}</div>
          </div>
        </section>
        <section className="mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">最活躍政治家</h2>
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              {topByVolumePoliticians.map((politician) => (
                <Link
                  key={politician.id}
                  href={`/politicians/${politician.id}`}
                  className="bg-gray-900 border border-gray-700 rounded-md p-3 hover:border-gray-500 transition-colors flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
                    <PoliticianProfileImage
                      politicianId={politician.id}
                      politicianName={politician.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-white font-medium truncate">{politician.name}</div>
                    <div className="text-xs text-gray-400 mt-1 truncate">
                      {(politician.party || 'Unknown')} {politician.chamber || ''}
                    </div>
                    <div className="text-sm text-blue-300 mt-2">
                      交易金額：${new Intl.NumberFormat('en-US').format(Math.round(politician.volume))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
        <form className="flex flex-col sm:flex-row gap-3 mb-3" method="get">
          <label className={fieldLabelStyles()}>
            <span className="w-full sm:w-auto text-gray-400">
              <span className="zh-Hant">搜尋姓名</span>
              <span className="zh-Hans hidden">搜索姓名</span>
            </span>
            <input 
              name="name" 
              defaultValue={searchName} 
              placeholder="按姓名搜尋..."
              className={fieldControlStyles()} 
              aria-label="Search by politician name"
            />
          </label>
          <label className={fieldLabelStyles()}>
            <span className="w-full sm:w-auto text-gray-400">
              <span className="zh-Hant">議院</span>
              <span className="zh-Hans hidden">议院</span>
            </span>
            <select name="chamber" defaultValue={chamber} className={fieldControlStyles()} aria-label="Filter by chamber">
              <option value="">全部</option>
              <option value="House">眾議院</option>
              <option value="Senate">參議院</option>
            </select>
          </label>
          <label className={fieldLabelStyles()}>
            <span className="w-full sm:w-auto text-gray-400">
              <span className="zh-Hant">排序</span>
              <span className="zh-Hans hidden">排序</span>
            </span>
            <select name="sort" defaultValue={sortKey} className={fieldControlStyles()} aria-label="Sort by">
              <option value="trades">交易</option>
              <option value="issuers">發行商</option>
              <option value="volume">交易金額</option>
              <option value="portfolio">投資組合表現</option>
              <option value="performance">表現 vs S&P 500</option>
              <option value="name">姓名</option>
            </select>
          </label>
          <label className={fieldLabelStyles()}>
            <span className="w-full sm:w-auto text-gray-400">
              <span className="zh-Hant">方向</span>
              <span className="zh-Hans hidden">方向</span>
            </span>
            <select name="order" defaultValue={order} className={fieldControlStyles()} aria-label="Sort order">
              <option value="asc">升序</option>
              <option value="desc">降序</option>
            </select>
          </label>
          <button className={actionStyles('ghost')} type="submit" aria-label="Apply filters">
            <span className="zh-Hant">套用</span>
            <span className="zh-Hans hidden">应用</span>
          </button>
        </form>
        
        {/* Pagination Controls */}
        <div className="flex justify-center items-center gap-2 mb-4">
          {page > 1 && (
            <a 
              href={`/politicians?${new URLSearchParams({ 
                page: String(page - 1),
                ...(chamber ? { chamber } : {}),
                ...(searchName ? { name: searchName } : {}),
                sort: sortKey,
                order: order
              }).toString()}`}
              className={actionStyles('ghost')}
            >
              <span className="zh-Hant">上一頁</span>
              <span className="zh-Hans hidden">上一页</span>
            </a>
          )}
          <span className="px-3 py-1 bg-gray-600 text-white rounded">
            {page} / {Math.ceil(totalPoliticians / pageSize)}
          </span>
          {page < Math.ceil(totalPoliticians / pageSize) && (
            <a 
              href={`/politicians?${new URLSearchParams({ 
                page: String(page + 1),
                ...(chamber ? { chamber } : {}),
                ...(searchName ? { name: searchName } : {}),
                sort: sortKey,
                order: order
              }).toString()}`}
              className={actionStyles('ghost')}
            >
              <span className="zh-Hant">下一頁</span>
              <span className="zh-Hans hidden">下一页</span>
            </a>
          )}
        </div>
        
        {rows.length === 0 ? (
          <StateNotice
            title="沒有符合條件的政治家"
            description="請調整搜尋或議院篩選條件後重試。"
            actions={
              <Link
                href="/politicians"
                className={actionStyles('primary')}
              >
                清除篩選
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {rows.map((politician) => (
              <PoliticianCard key={politician.id} politician={politician} showWatchlistButton={true} initialInWatchlist={false} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}


