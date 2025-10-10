import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import LoadingWrapper from '@/components/LoadingWrapper';
import LoadingSpinner from '@/components/LoadingSpinner';
import PoliticianProfileImage from '@/components/PoliticianProfileImage';
import IssuerTradesTable from '@/components/IssuerTradesTable';
import IssuerTimelineChart from '@/components/IssuerTimelineChart';
import WatchlistButton from '@/components/WatchlistButton';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

interface IssuerDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function IssuerDetailPage({ 
  params, 
  searchParams 
}: IssuerDetailPageProps & { 
  searchParams: Promise<Record<string, string | string[] | undefined>> 
}) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await getSessionUser();
  
  // Pagination and sorting parameters
  const pageSize = 20;
  const page = Math.max(1, Number(typeof sp.page === 'string' ? sp.page : 1) || 1);
  const allowedSort = new Set(['traded_at', 'published_at', 'price', 'size_max']);
  const order = (typeof sp.order === 'string' && sp.order.toLowerCase() === 'asc') ? 'asc' : 'desc';
  const sortKeyRaw = typeof sp.sort === 'string' ? sp.sort : 'traded_at';
  const sortKey = allowedSort.has(sortKeyRaw) ? sortKeyRaw : 'traded_at';
  
  const orderBy: Record<string, 'asc' | 'desc'> = {};
  orderBy[sortKey] = order;
  
  // Get issuer with paginated trades
  const issuer = await prisma.issuer.findUnique({
    where: { id },
    include: {
      Trade: {
        include: {
          Politician: true
        },
        orderBy: [orderBy],
        skip: (page - 1) * pageSize,
        take: pageSize
      }
    }
  });

  if (!issuer) {
    notFound();
  }

  // Get total count for pagination
  const totalTrades = await prisma.trade.count({
    where: { issuer_id: id }
  });

  // Calculate stats from all trades (not just current page)
  const allTrades = await prisma.trade.findMany({
    where: { issuer_id: id },
    include: { Politician: true }
  }).catch(error => {
    console.error('Error fetching trades for issuer:', error);
    return [];
  });


  const trades = issuer.Trade; // Current page trades
  const politicians = new Set(allTrades.map(t => t.Politician.id)).size;
  const volume = allTrades.reduce((sum, trade) => {
    const avgSize = trade.size_min && trade.size_max ? 
      (Number(trade.size_min) + Number(trade.size_max)) / 2 : 0;
    return sum + avgSize;
  }, 0);

  const lastTraded = allTrades.length > 0 ? 
    new Date(Math.max(...allTrades.map(t => new Date(t.traded_at).getTime()))) : 
    null;

  // Get most active politicians from all trades
  const politicianCounts = allTrades.reduce((acc, trade) => {
    const politician_id = trade.Politician.id;
    const politicianName = trade.Politician.name;
    const politicianParty = trade.Politician.party;
    const politicianChamber = trade.Politician.chamber;
    acc[politician_id] = acc[politician_id] || { 
      id: politician_id,
      name: politicianName, 
      party: politicianParty,
      chamber: politicianChamber,
      count: 0 
    };
    acc[politician_id].count++;
    return acc;
  }, {} as Record<string, { id: string; name: string; party: string | null; chamber: string | null; count: number }>);

  const mostActivePoliticians = Object.values(politicianCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Get party breakdown from all trades
  const partyBreakdown = allTrades.reduce((acc, trade) => {
    const party = trade.Politician.party || 'Other';
    if (!acc[party]) {
      acc[party] = { trades: 0, buy: 0, sell: 0 };
    }
    acc[party].trades++;
    if (trade.type === 'buy') {
      acc[party].buy++;
    } else if (trade.type === 'sell') {
      acc[party].sell++;
    }
    return acc;
  }, {} as Record<string, { trades: number; buy: number; sell: number }>);

  // Prepare trade data for table
  const tradeRows = trades.slice(0, 50).map(trade => ({
    politician: trade.Politician.name,
    politicianId: trade.Politician.id,
    party: trade.Politician.party || 'Unknown',
    published: trade.published_at ? new Date(trade.published_at).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }) : '',
    traded: new Date(trade.traded_at).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }),
    type: trade.type,
    size: trade.size_min && trade.size_max ? 
      `${trade.size_min}K–${trade.size_max}K` : 
      'N/A',
    detailUrl: `/trades/${trade.id}`
  }));

  return (
    <div className="min-h-screen bg-gray-900">
      <main className="p-4">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center mb-4">
            {/* Issuer Info */}
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                {issuer.name}
              </h1>
              {issuer.ticker && (
                <div className="text-lg text-gray-300 mb-2">
                  {issuer.ticker}
                </div>
              )}
              <div className="flex flex-wrap gap-2 mb-3">
                {issuer.sector && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-500 text-white">
                    {issuer.sector}
                  </span>
                )}
                {issuer.country && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-600 text-white">
                    {issuer.country}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 shadow-md">
              <div className="text-2xl font-bold text-white">{allTrades.length}</div>
              <div className="text-sm text-gray-400">交易次數</div>
            </div>
            <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 shadow-md">
              <div className="text-2xl font-bold text-white">{politicians}</div>
              <div className="text-sm text-gray-400">政治家</div>
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

        {/* Timeline Chart */}
        <div className="mb-6">
          <IssuerTimelineChart 
            trades={allTrades?.map(trade => ({
              id: trade.id,
              traded_at: trade.traded_at.toISOString(),
              type: trade.type as 'buy' | 'sell' | 'exchange',
              politician: {
                id: trade.Politician.id,
                name: trade.Politician.name,
                party: trade.Politician.party,
                chamber: trade.Politician.chamber
              },
              size_min: trade.size_min ? Number(trade.size_min) : undefined,
              size_max: trade.size_max ? Number(trade.size_max) : undefined,
              price: trade.price ? Number(trade.price) : undefined
            })) || []}
            issuerName={issuer.name}
          />
        </div>

        {/* Party Breakdown */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">按黨派交易</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(partyBreakdown).map(([party, data]) => (
              <div key={party} className="bg-gray-800 border border-gray-600 rounded-lg p-4 shadow-md">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white font-medium">{party}</span>
                  <span className="text-gray-400">{data.trades} 筆交易</span>
                </div>
                <div className="flex gap-4 text-sm">
                  <span className="text-green-400">買入: {data.buy}</span>
                  <span className="text-red-400">賣出: {data.sell}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Most Active Politicians */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">最活躍政治家</h2>
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 shadow-md">
            <div className="space-y-2">
              {mostActivePoliticians.map((politician, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-700 rounded-full overflow-hidden flex-shrink-0">
                      <PoliticianProfileImage 
                        politicianId={politician.id}
                        politicianName={politician.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <a 
                        href={`/politicians/${politician.id}`}
                        className="text-blue-400 hover:text-blue-300 underline text-white hover:text-blue-300"
                      >
                        {politician.name}
                      </a>
                      <div className="text-xs text-gray-400">
                        {politician.party} {politician.chamber}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {user && (
                      <WatchlistButton type="politician" politicianId={politician.id} />
                    )}
                    <span className="text-gray-400">{politician.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
                  <option value="traded_at">交易日期</option>
                  <option value="published_at">發布日期</option>
                  <option value="price">價格</option>
                  <option value="size_max">金額</option>
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
                href={`/issuers/${id}?${new URLSearchParams({ 
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
                href={`/issuers/${id}?${new URLSearchParams({ 
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
            <IssuerTradesTable data={tradeRows} />
          </LoadingWrapper>
        </div>

        {/* Back Button */}
        <div className="mt-6">
          <Link 
            href="/issuers" 
            className="inline-flex items-center px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
          >
            ← 返回發行商列表
          </Link>
        </div>
      </main>
    </div>
  );
}
