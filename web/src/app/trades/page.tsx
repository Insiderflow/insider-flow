import Link from 'next/link';
import LastUpdated, { DataFreshnessIndicator } from '@/components/LastUpdated';
import { getCurrentUserWithTier, isPaid } from '@/lib/membership';
import StateNotice from '@/components/StateNotice';
import { actionStyles } from '@/components/actionStyles';
import { fieldControlStyles, fieldLabelStyles } from '@/components/formStyles';
import { bodySubtextStyles, pageTitleStyles } from '@/components/typographyStyles';
import { textLinkStyles } from '@/components/linkStyles';
import { getTradesPageData, type TradeSortKey, type SortOrder } from '@/lib/repos/tradesRepo';
import StatCard from '@/components/StatCard';
import FilterBar from '@/components/FilterBar';
import PaginationBar from '@/components/PaginationBar';

export const dynamic = 'force-dynamic';

export default async function TradesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const me = await getCurrentUserWithTier();
  const canAccessDetails = isPaid(me);
  const sp = await searchParams;
  const pageSize = 30;
  const page = Math.max(1, Number(typeof sp.page === 'string' ? sp.page : 1) || 1);
  const allowedSort = new Set<TradeSortKey>(['traded_at', 'published_at', 'price', 'size_max']);
  const order: SortOrder = (typeof sp.order === 'string' && sp.order.toLowerCase() === 'asc') ? 'asc' : 'desc';
  const sortKeyRaw = typeof sp.sort === 'string' ? sp.sort : 'traded_at';
  const sortKey: TradeSortKey = allowedSort.has(sortKeyRaw as TradeSortKey) ? (sortKeyRaw as TradeSortKey) : 'traded_at';
  const qPolitician = typeof sp.qp === 'string' ? sp.qp : '';
  const qIssuer = typeof sp.qi === 'string' ? sp.qi : '';
  const typeFilter = typeof sp.type === 'string' ? sp.type : '';
  const tradedFrom = typeof sp.from === 'string' ? sp.from : '';
  const tradedTo = typeof sp.to === 'string' ? sp.to : '';

  const { rows: trades, total: totalCount, stats, lastTradeDate } = await getTradesPageData({
    page,
    pageSize,
    sortBy: sortKey,
    order,
    politician: qPolitician,
    issuer: qIssuer,
    type: typeFilter,
    tradedFrom: tradedFrom || undefined,
    tradedTo: tradedTo || undefined,
  });

  const hasPrev = page > 1;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const hasNext = page < totalPages;

  const baseQS = new URLSearchParams(Object.entries(sp as Record<string,string|undefined>).filter(([k,v]) => k !== 'page' && typeof v === 'string') as [string,string][]);
  const prevHref = hasPrev ? `/trades?${new URLSearchParams({ ...Object.fromEntries(baseQS), page: String(page - 1) }).toString()}` : '#';
  const nextHref = hasNext ? `/trades?${new URLSearchParams({ ...Object.fromEntries(baseQS), page: String(page + 1) }).toString()}` : '#';

  return (
    <div className="min-h-screen bg-gray-900">
      <main className="p-4">
        <div className="flex justify-between items-center mb-2">
          <h1 className={pageTitleStyles()}>
            <span className="zh-Hant">最新交易</span>
            <span className="zh-Hans hidden">最新交易</span>
          </h1>
          <div className="flex items-center gap-2">
            <DataFreshnessIndicator timestamp={lastTradeDate} />
            <LastUpdated timestamp={lastTradeDate} className="text-xs text-gray-400" />
          </div>
        </div>
        <p className={`${bodySubtextStyles()} mb-4 text-sm sm:text-base`}>
          <span className="zh-Hant">追蹤議員與發行商的最新交易動態</span>
          <span className="zh-Hans hidden">追踪国会股票交易动态</span>
        </p>
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <StatCard label={<><span className="zh-Hant">總交易</span><span className="zh-Hans hidden">总交易</span></>} value={stats.tradeCount.toLocaleString('en-US')} />
          <StatCard label={<><span className="zh-Hant">政治家</span><span className="zh-Hans hidden">政治家</span></>} value={stats.politicianCount.toLocaleString('en-US')} />
          <StatCard label={<><span className="zh-Hant">發行商</span><span className="zh-Hans hidden">发行商</span></>} value={stats.issuerCount.toLocaleString('en-US')} />
        </section>
        <PaginationBar page={page} totalPages={totalPages} prevHref={prevHref} nextHref={nextHref} className="mb-3" />
        <FilterBar id="trades-filters" className="mb-4">
          <label className={fieldLabelStyles()}>
            <span className="w-full sm:w-28 text-gray-400">
              <span className="zh-Hant">按政治家</span>
              <span className="zh-Hans hidden">按政治家</span>
            </span>
            <input name="qp" defaultValue={qPolitician} placeholder="輸入政治家姓名" className={fieldControlStyles()} />
          </label>
          <label className={fieldLabelStyles()}>
            <span className="w-full sm:w-24 text-gray-400">
              <span className="zh-Hant">按發行商</span>
              <span className="zh-Hans hidden">按发行商</span>
            </span>
            <input name="qi" defaultValue={qIssuer} placeholder="輸入發行商名稱" className={fieldControlStyles()} />
          </label>
          <label className={fieldLabelStyles()}>
            <span className="w-full sm:w-auto text-gray-400">交易類型</span>
            <select name="type" defaultValue={typeFilter} className={fieldControlStyles()}>
              <option value="">全部</option>
              <option value="BUY">買入</option>
              <option value="SELL">賣出</option>
              <option value="EXCHANGE">交換</option>
            </select>
          </label>
          <label className={fieldLabelStyles()}>
            <span className="w-full sm:w-auto text-gray-400">交易日期</span>
            <div className="flex gap-2">
              <input type="date" name="from" defaultValue={tradedFrom} className={fieldControlStyles()} />
              <input type="date" name="to" defaultValue={tradedTo} className={fieldControlStyles()} />
            </div>
          </label>
          <label className={fieldLabelStyles()}>
            <span className="w-full sm:w-auto text-gray-400">
              <span className="zh-Hant">排序</span>
              <span className="zh-Hans hidden">排序</span>
            </span>
            <select name="sort" defaultValue={sortKey} className={fieldControlStyles()} aria-label="Sort by">
              <option value="traded_at">交易日期</option>
              <option value="published_at">發布日期</option>
              <option value="price">價格</option>
              <option value="size_max">交易金額</option>
            </select>
          </label>
          <label className={fieldLabelStyles()}>
            <span className="w-full sm:w-auto text-gray-400">
              <span className="zh-Hant">方向</span>
              <span className="zh-Hans hidden">方向</span>
            </span>
            <select name="order" defaultValue={order} className={fieldControlStyles()} aria-label="Sort order">
              <option value="desc">新到舊</option>
              <option value="asc">舊到新</option>
            </select>
          </label>
          <button className={`${actionStyles('secondary')} col-span-1`} type="submit" aria-label="Apply filters">
            <span className="zh-Hant">套用</span>
            <span className="zh-Hans hidden">应用</span>
          </button>
          <Link href="/trades" className={`${actionStyles('ghost')} col-span-1`}>
            清除
          </Link>
        </FilterBar>
        {trades.length === 0 ? (
          <StateNotice
            title="查無符合條件的交易"
            description="請調整篩選條件，或清除目前篩選重新查看所有交易。"
            actions={<Link href="/trades" className={actionStyles('primary')}>清除篩選</Link>}
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-700">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-800 text-gray-300">
                <tr>
                  <th className="px-3 py-2 text-left">政治家</th>
                  <th className="px-3 py-2 text-left">發行商</th>
                  <th className="px-3 py-2 text-left">交易日</th>
                  <th className="px-3 py-2 text-left">申報日</th>
                  <th className="px-3 py-2 text-left">類型</th>
                  <th className="px-3 py-2 text-left">交易金額</th>
                  <th className="px-3 py-2 text-left">價格</th>
                </tr>
              </thead>
              <tbody className="bg-gray-900">
                {trades.map((t) => {
                  const politicianHref = canAccessDetails ? `/politicians/${t.politician.id}` : '/upgrade?reason=paid_required';
                  const issuerHref = canAccessDetails ? `/issuers/${t.issuer.id}` : '/upgrade?reason=paid_required';
                  return (
                  <tr key={t.id} className="border-t border-gray-800">
                    <td className="px-3 py-2">
                      <Link className={textLinkStyles()} href={politicianHref}>{t.politician.name}</Link>
                    </td>
                    <td className="px-3 py-2">
                      <Link className={textLinkStyles()} href={issuerHref}>{t.issuer.name}</Link>
                    </td>
                    <td className="px-3 py-2 text-gray-300">{new Date(t.tradedAt).toLocaleDateString('zh-TW')}</td>
                    <td className="px-3 py-2 text-gray-300">{t.publishedAt ? new Date(t.publishedAt).toLocaleDateString('zh-TW') : '-'}</td>
                    <td className="px-3 py-2 text-gray-300">{t.type}</td>
                    <td className="px-3 py-2 text-gray-300">
                      {t.sizeMin && t.sizeMax ? `$${Math.round(t.sizeMin).toLocaleString('en-US')} - $${Math.round(t.sizeMax).toLocaleString('en-US')}` : '-'}
                    </td>
                    <td className="px-3 py-2 text-gray-300">{t.price !== null ? `$${t.price.toFixed(2)}` : '-'}</td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}


