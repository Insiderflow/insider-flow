import { prisma } from '@/lib/prisma';
import LoadingWrapper from '@/components/LoadingWrapper';
import PoliticianCard from '@/components/PoliticianCard';
import { getSessionUser } from '@/lib/auth';
import { StatsCardSkeleton, PoliticianCardSkeleton } from '@/components/SkeletonLoader';
import LastUpdated, { DataFreshnessIndicator } from '@/components/LastUpdated';
export const dynamic = 'force-dynamic';

type Row = { id: string; name: string; party: string | null; chamber: string | null; trades: number; issuers: number; volume: number; lastTraded: Date | null };

export default async function PoliticiansPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const _user = await getSessionUser();
  const chamber = typeof sp.chamber === 'string' ? sp.chamber : '';
  const searchName = typeof sp.name === 'string' ? sp.name : '';
  const allowedSort = new Set(['name', 'trades', 'issuers', 'volume']);
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

  // Get politicians with their stats, sorted by the requested field
  let politicians;
  
  if (sortKey === 'volume') {
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
    const orderBy: any = {};
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
    return {
      id: politician.id,
      name: politician.name,
      party: politician.party,
      chamber: politician.chamber,
      trades: politician._count.Trade,
      issuers: issuerCountMap.get(politician.id) || 0,
      volume: volumeMap.get(politician.id) || 0,
      lastTraded: lastTradeMap.get(politician.id) || null
    };
  });
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
          <h1 className="text-xl sm:text-2xl font-semibold text-white">
            <span className="zh-Hant">政治家</span>
            <span className="zh-Hans hidden">政治家</span>
          </h1>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-400">
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
          <LoadingWrapper fallback={<StatsCardSkeleton />}>
            <div className="border border-gray-600 bg-gray-800 p-2 sm:p-4 rounded shadow-md">
              <div className="text-xs text-white">
                <span className="zh-Hant">交易</span>
                <span className="zh-Hans hidden">交易</span>
              </div>
              <div className="text-lg sm:text-xl font-semibold text-white">{tradeCount}</div>
            </div>
          </LoadingWrapper>
          <LoadingWrapper fallback={<StatsCardSkeleton />}>
            <div className="border border-gray-600 bg-gray-800 p-2 sm:p-4 rounded shadow-md">
              <div className="text-xs text-white">
                <span className="zh-Hant">政治家</span>
                <span className="zh-Hans hidden">政治家</span>
              </div>
              <div className="text-lg sm:text-xl font-semibold text-white">{polCount}</div>
            </div>
          </LoadingWrapper>
          <LoadingWrapper fallback={<StatsCardSkeleton />}>
            <div className="border border-gray-600 bg-gray-800 p-2 sm:p-4 rounded shadow-md">
              <div className="text-xs text-white">
                <span className="zh-Hant">發行商</span>
                <span className="zh-Hans hidden">发行商</span>
              </div>
              <div className="text-lg sm:text-xl font-semibold text-white">{issuerCount}</div>
            </div>
          </LoadingWrapper>
        </section>
        <form className="flex flex-col sm:flex-row gap-3 mb-3" method="get">
          <label className="text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-white">
            <span className="w-full sm:w-auto text-gray-400">
              <span className="zh-Hant">搜尋姓名</span>
              <span className="zh-Hans hidden">搜索姓名</span>
            </span>
            <input 
              name="name" 
              defaultValue={searchName} 
              placeholder="按姓名搜尋..."
              className="border border-gray-600 p-1 bg-gray-800 text-white text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors duration-200" 
              aria-label="Search by politician name"
            />
          </label>
          <label className="text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-white">
            <span className="w-full sm:w-auto text-gray-400">
              <span className="zh-Hant">議院</span>
              <span className="zh-Hans hidden">议院</span>
            </span>
            <select name="chamber" defaultValue={chamber} className="border border-gray-600 p-1 bg-gray-800 text-white text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors duration-200" aria-label="Filter by chamber">
              <option value="">全部</option>
              <option value="House">眾議院</option>
              <option value="Senate">參議院</option>
            </select>
          </label>
          <label className="text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-white">
            <span className="w-full sm:w-auto text-gray-400">
              <span className="zh-Hant">排序</span>
              <span className="zh-Hans hidden">排序</span>
            </span>
            <select name="sort" defaultValue={sortKey} className="border border-gray-600 p-1 bg-gray-800 text-white text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors duration-200" aria-label="Sort by">
              <option value="trades">
                <span className="zh-Hant">交易</span>
                <span className="zh-Hans hidden">交易</span>
              </option>
              <option value="issuers">
                <span className="zh-Hant">發行商</span>
                <span className="zh-Hans hidden">发行商</span>
              </option>
              <option value="volume">
                <span className="zh-Hant">交易金額</span>
                <span className="zh-Hans hidden">交易金额</span>
              </option>
              <option value="name">
                <span className="zh-Hant">姓名</span>
                <span className="zh-Hans hidden">姓名</span>
              </option>
            </select>
          </label>
          <label className="text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-white">
            <span className="w-full sm:w-auto text-gray-400">
              <span className="zh-Hant">方向</span>
              <span className="zh-Hans hidden">方向</span>
            </span>
            <select name="order" defaultValue={order} className="border border-gray-600 p-1 bg-gray-800 text-white text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors duration-200" aria-label="Sort order">
              <option value="asc">
                <span className="zh-Hant">升序</span>
                <span className="zh-Hans hidden">升序</span>
              </option>
              <option value="desc">
                <span className="zh-Hant">降序</span>
                <span className="zh-Hans hidden">降序</span>
              </option>
            </select>
          </label>
          <button className="border border-gray-600 px-3 py-1 text-xs sm:text-sm bg-gray-800 text-white hover:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none transition-colors duration-200" type="submit" aria-label="Apply filters">
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
              className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none transition-colors duration-200"
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
              className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none transition-colors duration-200"
            >
              <span className="zh-Hant">下一頁</span>
              <span className="zh-Hans hidden">下一页</span>
            </a>
          )}
        </div>
        
        <LoadingWrapper fallback={
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <PoliticianCardSkeleton key={index} />
            ))}
          </div>
        }>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {rows.map((politician) => (
              <PoliticianCard key={politician.id} politician={politician} showWatchlistButton={true} initialInWatchlist={false} />
            ))}
          </div>
        </LoadingWrapper>
      </main>
    </div>
  );
}


