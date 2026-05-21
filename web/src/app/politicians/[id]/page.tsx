import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import PoliticianProfileImage from '@/components/PoliticianProfileImage';
import WatchlistButton from '@/components/WatchlistButton';
import PoliticianTopIssuersPieChart from '@/components/PoliticianTopIssuersPieChart';
import { getCurrentUserWithTier, isPaid } from '@/lib/membership';
import { badgeStyles } from '@/components/badgeStyles';
import { navLinkButtonStyles, textLinkStyles } from '@/components/linkStyles';
import { getPoliticianDetailData, type SortOrder } from '@/lib/repos/politiciansRepo';
import { isPoliticianWatchedByUser } from '@/lib/repos/watchlistRepo';
import IssuerMarketTrendChart from '@/components/IssuerMarketTrendChart';
import { sectorToZh } from '@/lib/sectorI18n';

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
  const me = await getCurrentUserWithTier();
  if (!isPaid(me)) {
    redirect('/upgrade?reason=paid_required');
  }
  const sp = await searchParams;
  
  const pageSize = 20;
  const page = Math.max(1, Number(typeof sp.page === 'string' ? sp.page : 1) || 1);
  const allowedSort = new Set(['traded_at', 'published_at', 'price', 'size_max']);
  const order: SortOrder = (typeof sp.order === 'string' && sp.order.toLowerCase() === 'asc') ? 'asc' : 'desc';
  const sortKeyRaw = typeof sp.sort === 'string' ? sp.sort : 'traded_at';
  const sortKey = (allowedSort.has(sortKeyRaw) ? sortKeyRaw : 'traded_at') as 'traded_at' | 'published_at' | 'price' | 'size_max';

  const detail = await getPoliticianDetailData({
    id,
    page,
    pageSize,
    sortBy: sortKey,
    order,
  });

  if (!detail) {
    notFound();
  }
  const { politician, trades, topIssuers, totalTrades, totalVolume, maxTrade, lastTraded, chartPoints } = detail;
  const initialWatching = me ? await isPoliticianWatchedByUser(me.id, politician.id) : false;

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
                <span className={badgeStyles(
                  politician.party === 'Republican'
                    ? 'republican'
                    : politician.party === 'Democrat'
                      ? 'democrat'
                      : 'neutral'
                )}>
                  {politician.party}
                </span>
                <span className={badgeStyles('neutral')}>
                  {politician.chamber}
                </span>
                <span className={badgeStyles('neutral')}>
                  {politician.state}
                </span>
              </div>
            {/* Watchlist button */}
            <div className="mt-2">
              <p className="text-xs text-gray-400 mb-2">
                <span className="zh-Hant">Email 追蹤此議員</span>
                <span className="zh-Hans hidden">Email 追踪此议员</span>
          <span className="ko hidden">Email로 이 의원 추적</span>
              </p>
              <WatchlistButton userId={me?.id} type="politician" politicianId={politician.id} initialWatching={initialWatching} />
            </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 shadow-md">
              <div className="text-2xl font-bold text-white">{totalTrades}</div>
              <div className="text-sm text-gray-400">交易次數</div>
            </div>
            <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 shadow-md">
              <div className="text-2xl font-bold text-white">{topIssuers.length}</div>
              <div className="text-sm text-gray-400">發行商</div>
            </div>
            <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 shadow-md">
              <div className="text-2xl font-bold text-white">${(totalVolume / 1000000).toFixed(1)}M</div>
              <div className="text-sm text-gray-400">交易金額</div>
            </div>
            <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 shadow-md">
              <div className="text-2xl font-bold text-white">${Math.round(maxTrade).toLocaleString('en-US')}</div>
              <div className="text-sm text-gray-400">最大交易</div>
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
            <PoliticianTopIssuersPieChart items={topIssuers} />
          </div>
        </div>

        <div className="mb-6">
          <IssuerMarketTrendChart issuerName={politician.name} points={chartPoints} />
        </div>

        {/* Recent Trades */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">最近交易</h2>
            <span className="text-sm text-gray-400">顯示 {trades.length} / {totalTrades} 筆交易</span>
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
          
          <div className="space-y-3">
            {trades.map((trade) => (
              <div key={trade.id} className="rounded-lg border border-gray-700 bg-gray-900 p-3">
                {(() => {
                  const tradeType = (trade.type || '').toUpperCase();
                  const badgeTone = tradeType === 'BUY' ? 'success' : tradeType === 'SELL' ? 'danger' : 'neutral';
                  return (
                    <>
                <div className="flex items-center justify-between">
                  <Link href={`/issuers/${trade.Issuer.id}`} className={textLinkStyles('muted')}>
                    {trade.Issuer.name} {trade.Issuer.ticker ? `(${trade.Issuer.ticker})` : ''}
                  </Link>
                  <span className={badgeStyles(badgeTone, 'xs')}>
                    {trade.type || 'N/A'}
                  </span>
                </div>
                <div className="mt-2 text-sm text-gray-300 flex flex-wrap gap-4">
                  <span>交易日：{new Date(trade.traded_at).toLocaleDateString('zh-TW')}</span>
                  <span>申報日：{trade.published_at ? new Date(trade.published_at).toLocaleDateString('zh-TW') : '-'}</span>
                  <span>產業：{sectorToZh(trade.Issuer.sector) || '未揭露'}</span>
                  <span>
                    金額：{trade.size_min && trade.size_max
                      ? `$${Math.round(Number(trade.size_min)).toLocaleString('en-US')} - $${Math.round(Number(trade.size_max)).toLocaleString('en-US')}`
                      : '未揭露'}
                  </span>
                </div>
                    </>
                  );
                })()}
              </div>
            ))}
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-6">
          <Link 
            href="/politicians" 
            className={navLinkButtonStyles()}
          >
            ← 返回政治家列表
          </Link>
        </div>
      </main>
    </div>
  );
}
