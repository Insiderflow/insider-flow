import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import LoadingWrapper from '@/components/LoadingWrapper';
import LoadingSpinner from '@/components/LoadingSpinner';
import PoliticianProfileImage from '@/components/PoliticianProfileImage';
import PoliticianTradesTable from '@/components/PoliticianTradesTable';
import WatchlistButton from '@/components/WatchlistButton';
import PortfolioChart from '@/components/PortfolioChart';

export const dynamic = 'force-dynamic';

interface PoliticianDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PoliticianDetailPage({ 
  params, 
  searchParams 
}: PoliticianDetailPageProps & { 
  searchParams: Promise<Record<string, string | string[] | undefined>> 
}) {
  const { id } = await params;
  const sp = await searchParams;
  
  // Pagination and sorting parameters
  const pageSize = 20;
  const page = Math.max(1, Number(typeof sp.page === 'string' ? sp.page : 1) || 1);
  const allowedSort = new Set(['tradedAt', 'publishedAt', 'price', 'sizeMax']);
  const order = (typeof sp.order === 'string' && sp.order.toLowerCase() === 'asc') ? 'asc' : 'desc';
  const sortKeyRaw = typeof sp.sort === 'string' ? sp.sort : 'tradedAt';
  const sortKey = allowedSort.has(sortKeyRaw) ? sortKeyRaw : 'tradedAt';
  
  const orderBy: Record<string, 'asc' | 'desc'> = {};
  orderBy[sortKey] = order;
  
  // Get politician with paginated trades
  const politician = await prisma.politician.findUnique({
    where: { id },
    include: {
      trades: {
        include: {
          issuer: true
        },
        orderBy: [orderBy],
        skip: (page - 1) * pageSize,
        take: pageSize
      }
    }
  });

  if (!politician) {
    notFound();
  }

  // Get total count for pagination
  const totalTrades = await prisma.trade.count({
    where: { politicianId: id }
  });

  // Calculate stats from all trades (not just current page)
  const allTrades = await prisma.trade.findMany({
    where: { politicianId: id },
    include: { issuer: true }
  });

  const trades = politician.trades; // Current page trades
  const issuers = new Set(allTrades.map(t => t.issuer.id)).size;
  const volume = allTrades.reduce((sum, trade) => {
    const avgSize = trade.sizeMin && trade.sizeMax ? 
      (Number(trade.sizeMin) + Number(trade.sizeMax)) / 2 : 0;
    return sum + avgSize;
  }, 0);

  const lastTraded = allTrades.length > 0 ? 
    new Date(Math.max(...allTrades.map(t => new Date(t.tradedAt).getTime()))) : 
    null;

  // Get most traded issuers from all trades
  const issuerCounts = allTrades.reduce((acc, trade) => {
    const issuerId = trade.issuer.id;
    const issuerName = trade.issuer.name;
    acc[issuerId] = acc[issuerId] || { id: issuerId, name: issuerName, count: 0 };
    acc[issuerId].count++;
    return acc;
  }, {} as Record<string, { id: string; name: string; count: number }>);

  const mostTradedIssuers = Object.values(issuerCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Get sector distribution (simplified - would need sector data)
  const sectors = allTrades.reduce((acc, _trade) => {
    // This is a simplified approach - in reality you'd need sector data
    const sector = 'Other'; // Placeholder
    acc[sector] = (acc[sector] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mostTradedSectors = Object.entries(sectors)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 4);

  // Prepare trade data for table
  const tradeRows = trades.slice(0, 50).map(trade => ({
    issuer: trade.issuer.name,
    issuerId: trade.issuer.id,
    ticker: trade.issuer.ticker || 'N/A',
    published: trade.publishedAt ? new Date(trade.publishedAt).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }) : '',
    traded: new Date(trade.tradedAt).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }),
    type: trade.type,
    size: trade.sizeMin && trade.sizeMax ? 
      `${trade.sizeMin}K–${trade.sizeMax}K` : 
      'N/A',
    detailUrl: `/trades/${trade.id}`
  }));

  return (
    <div className="min-h-screen bg-gray-900">
      <main className="p-4">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center mb-4">
            {/* Profile Picture */}
            <div className="w-20 h-20 bg-gray-700 rounded-full overflow-hidden flex-shrink-0">
              <PoliticianProfileImage 
                politicianId={politician.id}
                politicianName={politician.name}
              />
            </div>
            
            {/* Politician Info */}
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                {politician.name}
              </h1>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  politician.party === 'Republican' ? 'bg-red-500 text-white' : 
                  politician.party === 'Democrat' ? 'bg-blue-500 text-white' : 
                  'bg-gray-500 text-white'
                }`}>
                  {politician.party}
                </span>
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-600 text-white">
                  {politician.chamber}
                </span>
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-600 text-white">
                  {politician.state}
                </span>
              </div>
            {/* Watchlist button */}
            <WatchlistButton politicianId={politician.id} />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 shadow-md">
              <div className="text-2xl font-bold text-white">{allTrades.length}</div>
              <div className="text-sm text-gray-400">交易次數</div>
            </div>
            <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 shadow-md">
              <div className="text-2xl font-bold text-white">{issuers}</div>
              <div className="text-sm text-gray-400">發行商</div>
            </div>
            <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 shadow-md">
              <div className="text-2xl font-bold text-white">${(volume / 1000000).toFixed(1)}M</div>
              <div className="text-sm text-gray-400">交易金額</div>
            </div>
            <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 shadow-md">
              <div className="text-2xl font-bold text-white">
                {lastTraded ? lastTraded.toLocaleDateString('zh-TW', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                }) : '無交易記錄'}
              </div>
              <div className="text-sm text-gray-400">最後交易</div>
            </div>
          </div>
        </div>

        {/* Most Traded Issuers */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">最常交易發行商</h2>
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 shadow-md">
            <div className="space-y-2">
              {mostTradedIssuers.map((issuer, index) => (
                <div key={index} className="flex justify-between items-center">
                  <Link 
                    href={`/issuers/${issuer.id}`}
                    className="text-blue-400 hover:text-blue-300 underline text-white hover:text-blue-300"
                  >
                    {issuer.name}
                  </Link>
                  <span className="text-gray-400">{issuer.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Most Traded Sectors */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">最常交易產業</h2>
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 shadow-md">
            <div className="space-y-2">
              {mostTradedSectors.map(([sector, count], index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-white">{sector}</span>
                  <span className="text-gray-400">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Portfolio Comparison Chart */}
        <div className="mb-6">
          <PortfolioChart politician={politician.name} />
        </div>

        {/* Recent Trades Table */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">最近交易</h2>
            <span className="text-sm text-gray-400">
              顯示 {trades.length} / {totalTrades} 筆交易
            </span>
          </div>
          
          {/* Pagination and Sorting Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
            <div className="text-sm text-gray-300">
              第 {page} 頁，共 {Math.ceil(totalTrades / pageSize)} 頁
            </div>
            <div className="flex items-center gap-4">
              <form method="get" className="flex items-center gap-2">
                <input type="hidden" name="page" value="1" />
                <label className="text-sm text-gray-400">排序:</label>
                <select 
                  name="sort" 
                  defaultValue={sortKey}
                  className="border border-gray-600 p-1 bg-gray-800 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors duration-200"
                >
                  <option value="tradedAt">交易日期</option>
                  <option value="publishedAt">發布日期</option>
                  <option value="price">價格</option>
                  <option value="sizeMax">金額</option>
                </select>
                <select 
                  name="order" 
                  defaultValue={order}
                  className="border border-gray-600 p-1 bg-gray-800 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors duration-200"
                >
                  <option value="desc">新到舊</option>
                  <option value="asc">舊到新</option>
                </select>
                <button 
                  type="submit"
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none transition-colors duration-200 text-sm"
                >
                  套用
                </button>
              </form>
            </div>
          </div>
          
          {/* Pagination Controls */}
          <div className="flex justify-center items-center gap-2 mb-4">
            {page > 1 && (
              <a 
                href={`/politicians/${id}?${new URLSearchParams({ 
                  page: String(page - 1),
                  sort: sortKey,
                  order: order
                }).toString()}`}
                className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none transition-colors duration-200"
              >
                上一頁
              </a>
            )}
            <span className="px-3 py-1 bg-gray-600 text-white rounded">
              {page} / {Math.ceil(totalTrades / pageSize)}
            </span>
            {page < Math.ceil(totalTrades / pageSize) && (
              <a 
                href={`/politicians/${id}?${new URLSearchParams({ 
                  page: String(page + 1),
                  sort: sortKey,
                  order: order
                }).toString()}`}
                className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none transition-colors duration-200"
              >
                下一頁
              </a>
            )}
          </div>
          
          <LoadingWrapper fallback={
            <div className="border border-gray-600 bg-gray-800 rounded shadow-md flex justify-center items-center min-h-[400px]">
              <LoadingSpinner size="lg" />
            </div>
          }>
            <PoliticianTradesTable 
              data={tradeRows} 
              politicianId={id}
              currentSort={sortKey}
              currentOrder={order}
            />
          </LoadingWrapper>
        </div>

        {/* Back Button */}
        <div className="mt-6">
          <Link 
            href="/politicians" 
            className="inline-flex items-center px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
          >
            ← 返回政治家列表
          </Link>
        </div>
      </main>
    </div>
  );
}
