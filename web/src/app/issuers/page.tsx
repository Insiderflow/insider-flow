import { prisma } from '@/lib/prisma';
import LoadingWrapper from '@/components/LoadingWrapper';
import SortableIssuersTable from '@/components/SortableIssuersTable';
import { StatsCardSkeleton, IssuerCardSkeleton } from '@/components/SkeletonLoader';
import LastUpdated, { DataFreshnessIndicator } from '@/components/LastUpdated';
export const dynamic = 'force-dynamic';

type Row = { id: string; name: string; ticker: string | null; trades: number; politicians: number; volume: number };

export default async function IssuersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const allowedSort = new Set(['name', 'trades', 'politicians', 'volume']);
  const sortKeyRaw = typeof sp.sort === 'string' ? sp.sort : 'trades';
  const sortKey = allowedSort.has(sortKeyRaw) ? sortKeyRaw : 'trades';
  const order = (typeof sp.order === 'string' && sp.order.toLowerCase() === 'asc') ? 'asc' : 'desc';
  const pageSize = 50;
  const page = Math.max(1, Number(typeof sp.page === 'string' ? sp.page : 1) || 1);

  // Get issuers with trade counts using Prisma
  const issuers = await prisma.issuer.findMany({
    include: {
      trades: {
        include: {
          politician: true
        }
      }
    },
    take: pageSize,
    skip: (page - 1) * pageSize,
    orderBy: sortKey === 'name' ? { name: order } : undefined
  });

  // Transform to the expected format
  const rows: Row[] = issuers.map(issuer => {
    const trades = issuer.trades;
    const politicians = new Set(trades.map(t => t.politician.id)).size;
    const volume = trades.reduce((sum, trade) => {
      const avgSize = trade.sizeMin && trade.sizeMax ? 
        (Number(trade.sizeMin) + Number(trade.sizeMax)) / 2 : 0;
      return sum + avgSize;
    }, 0);

    return {
      id: issuer.id,
      name: issuer.name,
      ticker: issuer.ticker || 'N/A',
      trades: trades.length,
      politicians,
      volume
    };
  });

  // Sort the results (for computed columns)
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
      orderBy: { tradedAt: 'desc' },
      select: { tradedAt: true }
    }).then(result => result?.tradedAt || new Date())
  ]);
  const totalPages = Math.max(1, Math.ceil(issuerCount / pageSize));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;
  const baseQS = new URLSearchParams(Object.entries(sp as Record<string,string|undefined>).filter(([k,v]) => k !== 'page' && typeof v === 'string') as [string,string][]);
  const prevHref = hasPrev ? `/issuers?${new URLSearchParams({ ...Object.fromEntries(baseQS), page: String(page - 1) }).toString()}` : '#';
  const nextHref = hasNext ? `/issuers?${new URLSearchParams({ ...Object.fromEntries(baseQS), page: String(page + 1) }).toString()}` : '#';
  return (
    <div className="min-h-screen bg-gray-900">
      <main className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl sm:text-2xl font-semibold text-white">
            <span className="zh-Hant">發行商</span>
            <span className="zh-Hans hidden">发行商</span>
          </h1>
          <div className="flex items-center gap-2">
            <DataFreshnessIndicator timestamp={lastTradeDate} />
            <LastUpdated timestamp={lastTradeDate} className="text-xs text-gray-400" />
          </div>
        </div>
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <LoadingWrapper fallback={<StatsCardSkeleton />}>
            <div className="border border-gray-600 bg-gray-800 p-2 sm:p-4 rounded shadow-md">
              <div className="text-xs text-white">
                <span className="zh-Hant">總交易</span>
                <span className="zh-Hans hidden">总交易</span>
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
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs text-gray-300">
            <span className="zh-Hant">第 {page} 頁</span>
            <span className="zh-Hans hidden">第 {page} 页</span>
          </div>
          <div className="space-x-2">
            <a href={prevHref} aria-disabled={!hasPrev} className={`inline-block px-3 py-1 rounded border transition-colors duration-200 ${hasPrev ? 'bg-white text-[#007BFF] border-[#007BFF] hover:bg-[#007BFF] hover:text-white focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none' : 'bg-gray-700 text-gray-400 border-gray-600 cursor-not-allowed'}`} aria-label="Previous page">
              <span className="zh-Hant">上一頁</span>
              <span className="zh-Hans hidden">上一页</span>
            </a>
            <a href={nextHref} aria-disabled={!hasNext} className={`inline-block px-3 py-1 rounded border transition-colors duration-200 ${hasNext ? 'bg-white text-[#007BFF] border-[#007BFF] hover:bg-[#007BFF] hover:text-white focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none' : 'bg-gray-700 text-gray-400 border-gray-600 cursor-not-allowed'}`} aria-label="Next page">
              <span className="zh-Hant">下一頁</span>
              <span className="zh-Hans hidden">下一页</span>
            </a>
          </div>
        </div>
        <form className="flex flex-col sm:flex-row gap-3 mb-3" method="get">
          <label className="text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-white">
            <span className="w-full sm:w-auto text-gray-400">
              <span className="zh-Hant">排序</span>
              <span className="zh-Hans hidden">排序</span>
            </span>
            <select name="sort" defaultValue={sortKey} className="border border-gray-600 p-1 bg-gray-800 text-white text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors duration-200" aria-label="Sort by">
              <option value="trades">交易次數</option>
              <option value="politicians">政治家</option>
              <option value="volume">交易金額</option>
              <option value="name">名稱</option>
            </select>
          </label>
          <label className="text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-white">
            <span className="w-full sm:w-auto text-gray-400">
              <span className="zh-Hant">方向</span>
              <span className="zh-Hans hidden">方向</span>
            </span>
            <select name="order" defaultValue={order} className="border border-gray-600 p-1 bg-gray-800 text-white text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors duration-200" aria-label="Sort order">
              <option value="desc">高到低</option>
              <option value="asc">低到高</option>
            </select>
          </label>
          <button className="border border-gray-600 px-3 py-1 text-xs sm:text-sm bg-gray-800 text-white hover:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none transition-colors duration-200" type="submit" aria-label="Apply filters">
            <span className="zh-Hant">套用</span>
            <span className="zh-Hans hidden">应用</span>
          </button>
        </form>
        <LoadingWrapper fallback={<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <IssuerCardSkeleton key={index} />
          ))}
        </div>}>
          <SortableIssuersTable
            issuers={rows.map((r) => ({
              id: r.id,
              name: r.name,
              ticker: r.ticker ?? '',
              trades: r.trades,
              politicians: r.politicians,
              volume: new Intl.NumberFormat('en-US').format(Math.round(r.volume)),
            }))}
          />
        </LoadingWrapper>
      </main>
    </div>
  );
}


