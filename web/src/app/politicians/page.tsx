import LastUpdated, { DataFreshnessIndicator } from '@/components/LastUpdated';
import { getCurrentUserWithTier, isPaid } from '@/lib/membership';
import { redirect } from 'next/navigation';
import StateNotice from '@/components/StateNotice';
import Link from 'next/link';
import PoliticianProfileImage from '@/components/PoliticianProfileImage';
import { actionStyles } from '@/components/actionStyles';
import { fieldControlStyles, fieldLabelStyles } from '@/components/formStyles';
import { mutedLabelStyles, pageTitleStyles } from '@/components/typographyStyles';
import { getPoliticiansPageData, type PoliticianSortKey, type SortOrder } from '@/lib/repos/politiciansRepo';
import StatCard from '@/components/StatCard';
import FilterBar from '@/components/FilterBar';
import PaginationBar from '@/components/PaginationBar';
export const dynamic = 'force-dynamic';

export default async function PoliticiansPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const me = await getCurrentUserWithTier();
  if (!isPaid(me)) {
    redirect('/upgrade?reason=paid_required');
  }
  const chamber = typeof sp.chamber === 'string' ? sp.chamber : '';
  const searchName = typeof sp.name === 'string' ? sp.name : '';
  const allowedSort = new Set<PoliticianSortKey>(['name', 'trades', 'volume', 'lastTraded']);
  const sortKeyRaw = typeof sp.sort === 'string' ? sp.sort : 'trades';
  const sortKey: PoliticianSortKey = allowedSort.has(sortKeyRaw as PoliticianSortKey) ? (sortKeyRaw as PoliticianSortKey) : 'trades';
  const order: SortOrder = (typeof sp.order === 'string' && sp.order.toLowerCase() === 'asc') ? 'asc' : 'desc';
  const pageSize = 20;
  const page = Math.max(1, Number(typeof sp.page === 'string' ? sp.page : 1) || 1);
  const { rows, total } = await getPoliticiansPageData({
    page,
    pageSize,
    name: searchName,
    chamber,
    sortBy: sortKey,
    order,
  });
  const topByVolumePoliticians = [...rows]
    .sort((a, b) => b.totalVolume - a.totalVolume)
    .slice(0, 5);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const tradeCount = rows.reduce((sum, r) => sum + r.trades, 0);
  const polCount = total;
  const issuerCount = rows.reduce((sum, r) => sum + r.issuers, 0);
  const lastTradeDate = rows.find((r) => r.lastTraded)?.lastTraded || new Date();
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
              <span className="zh-Hant">顯示 {total} 位政治家 (第 {page} 頁，共 {totalPages} 頁)</span>
              <span className="zh-Hans hidden">显示 {total} 位政治家 (第 {page} 页，共 {totalPages} 页)</span>
            </div>
            <div className="flex items-center gap-2">
              <DataFreshnessIndicator timestamp={lastTradeDate} />
              <LastUpdated timestamp={lastTradeDate} className="text-xs text-gray-400" />
            </div>
          </div>
        </div>
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <StatCard label={<><span className="zh-Hant">交易</span><span className="zh-Hans hidden">交易</span></>} value={tradeCount.toLocaleString('en-US')} />
          <StatCard label={<><span className="zh-Hant">政治家</span><span className="zh-Hans hidden">政治家</span></>} value={polCount.toLocaleString('en-US')} />
          <StatCard label={<><span className="zh-Hant">發行商</span><span className="zh-Hans hidden">发行商</span></>} value={issuerCount.toLocaleString('en-US')} />
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
                      {(politician.party || '未揭露')} {politician.chamber || ''}
                    </div>
                    <div className="text-sm text-blue-300 mt-2">
                      交易金額：${new Intl.NumberFormat('en-US').format(Math.round(politician.totalVolume))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
        <FilterBar className="mb-3">
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
              <option value="volume">交易金額</option>
              <option value="lastTraded">最後交易</option>
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
        </FilterBar>

        <PaginationBar
          page={page}
          totalPages={totalPages}
          prevHref={`/politicians?${new URLSearchParams({
            page: String(Math.max(1, page - 1)),
            ...(chamber ? { chamber } : {}),
            ...(searchName ? { name: searchName } : {}),
            sort: sortKey,
            order,
          }).toString()}`}
          nextHref={`/politicians?${new URLSearchParams({
            page: String(Math.min(totalPages, page + 1)),
            ...(chamber ? { chamber } : {}),
            ...(searchName ? { name: searchName } : {}),
            sort: sortKey,
            order,
          }).toString()}`}
          className="mb-4"
        />
        
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
              <div key={politician.id} className="bg-gray-800 border border-gray-600 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Link href={`/politicians/${politician.id}`} className="w-14 h-14 rounded-full overflow-hidden bg-gray-700 shrink-0">
                    <PoliticianProfileImage politicianId={politician.id} politicianName={politician.name} />
                  </Link>
                  <div className="min-w-0">
                    <Link href={`/politicians/${politician.id}`} className="text-white font-semibold hover:text-blue-300 truncate block">
                      {politician.name}
                    </Link>
                    <p className="text-xs text-gray-400 truncate">
                      {politician.party || '未揭露'}{politician.chamber ? ` · ${politician.chamber}` : ''}
                    </p>
                    <p className="text-xs text-gray-400 truncate">最近交易：{politician.recentTradeLabel}</p>
                    <p className="text-xs text-gray-400 truncate">產業板塊：{politician.recentSector || '未揭露'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-gray-900 rounded p-2 text-gray-300">交易次數: <span className="text-white font-semibold">{politician.trades}</span></div>
                  <div className="bg-gray-900 rounded p-2 text-gray-300">發行商數: <span className="text-white font-semibold">{politician.issuers}</span></div>
                  <div className="bg-gray-900 rounded p-2 text-gray-300">最大交易: <span className="text-white font-semibold">${Math.round(politician.maxTrade).toLocaleString('en-US')}</span></div>
                  <div className="bg-gray-900 rounded p-2 text-gray-300">總金額: <span className="text-white font-semibold">${Math.round(politician.totalVolume).toLocaleString('en-US')}</span></div>
                </div>

                <div className="text-xs text-gray-400">
                  最後交易日期：{politician.lastTraded ? politician.lastTraded.toLocaleDateString('zh-TW') : '無資料'}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}


