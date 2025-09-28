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
  const user = await getSessionUser();
  const chamber = typeof sp.chamber === 'string' ? sp.chamber : '';
  const searchName = typeof sp.name === 'string' ? sp.name : '';
  const allowedSort = new Set(['name', 'trades', 'issuers', 'volume']);
  const sortKeyRaw = typeof sp.sort === 'string' ? sp.sort : 'trades';
  const sortKey = allowedSort.has(sortKeyRaw) ? sortKeyRaw : 'trades';
  const order = (typeof sp.order === 'string' && sp.order.toLowerCase() === 'asc') ? 'asc' : 'desc';
  const whereChamber = (chamber === 'House' || chamber === 'Senate') ? chamber : null;

  // Get politicians with trade counts using Prisma (optimized)
  const politicians = await prisma.politician.findMany({
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
    take: 200
  });

  // Transform to the expected format (optimized - no trade data loaded)
  const rows: Row[] = politicians.map(politician => {
    return {
      id: politician.id,
      name: politician.name,
      party: politician.party,
      chamber: politician.chamber,
      trades: politician._count.Trade,
      issuers: 0, // Will be calculated on individual pages
      volume: 0, // Will be calculated on individual pages
      lastTraded: null // Will be calculated on individual pages
    };
  });

  // Sort the results
  rows.sort((a, b) => {
    const aVal = a[sortKey as keyof Row];
    const bVal = b[sortKey as keyof Row];
    
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return order === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    
    const numA = Number(aVal);
    const numB = Number(bVal);
    return order === 'asc' ? numA - numB : numB - numA;
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
              <span className="zh-Hant">顯示 {rows.length} 位政治家</span>
              <span className="zh-Hans hidden">显示 {rows.length} 位政治家</span>
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
        <LoadingWrapper fallback={
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <PoliticianCardSkeleton key={index} />
            ))}
          </div>
        }>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {rows.map((politician) => (
              <PoliticianCard key={politician.id} politician={politician} showWatchlistButton={!!user} initialInWatchlist={false} />
            ))}
          </div>
        </LoadingWrapper>
      </main>
    </div>
  );
}


