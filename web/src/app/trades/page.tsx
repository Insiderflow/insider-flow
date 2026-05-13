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

function tradeTypeLabelZh(type: string) {
  const u = type.trim().toUpperCase();
  if (u === 'BUY' || u.includes('BUY')) return '買入';
  if (u === 'SELL' || u.includes('SELL')) return '賣出';
  if (u === 'EXCHANGE' || u.includes('EXCHANGE')) return '交換';
  return type;
}

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
  const tradesQs = (p: number) =>
    `/trades?${new URLSearchParams({ ...Object.fromEntries(baseQS), page: String(p) }).toString()}`;
  const prevHref = hasPrev ? tradesQs(page - 1) : '#';
  const nextHref = hasNext ? tradesQs(page + 1) : '#';

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
          <span className="zh-Hant">追蹤國會議員與上市公司的最新披露交易</span>
          <span className="zh-Hans hidden">追踪国会议员与上市公司的最新披露交易</span>
        </p>
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <StatCard
            label={
              <>
                <span className="zh-Hant">總交易筆數</span>
                <span className="zh-Hans hidden">总交易笔数</span>
              </>
            }
            value={stats.tradeCount.toLocaleString('zh-TW')}
          />
          <StatCard
            label={
              <>
                <span className="zh-Hant">國會議員</span>
                <span className="zh-Hans hidden">国会议员</span>
              </>
            }
            value={stats.politicianCount.toLocaleString('zh-TW')}
          />
          <StatCard
            label={
              <>
                <span className="zh-Hant">上市公司</span>
                <span className="zh-Hans hidden">上市公司</span>
              </>
            }
            value={stats.issuerCount.toLocaleString('zh-TW')}
          />
        </section>
        <PaginationBar
          page={page}
          totalPages={totalPages}
          prevHref={prevHref}
          nextHref={nextHref}
          getPageHref={tradesQs}
          className="mb-3"
        />
        <FilterBar id="trades-filters" className="mb-4" action="/trades">
          <label className={fieldLabelStyles()}>
            <span className="w-full text-gray-400 sm:w-28">
              <span className="zh-Hant">議員姓名</span>
              <span className="zh-Hans hidden">议员姓名</span>
            </span>
            <input
              name="qp"
              defaultValue={qPolitician}
              placeholder="輸入議員姓名…"
              className={fieldControlStyles()}
              aria-label="依議員姓名篩選"
            />
          </label>
          <label className={fieldLabelStyles()}>
            <span className="w-full text-gray-400 sm:w-24">
              <span className="zh-Hant">公司／代號</span>
              <span className="zh-Hans hidden">公司／代号</span>
            </span>
            <input
              name="qi"
              defaultValue={qIssuer}
              placeholder="公司名或股票代號…"
              className={fieldControlStyles()}
              aria-label="依發行商篩選"
            />
          </label>
          <label className={fieldLabelStyles()}>
            <span className="w-full text-gray-400 sm:w-auto">
              <span className="zh-Hant">買賣方向</span>
              <span className="zh-Hans hidden">买卖方向</span>
            </span>
            <select name="type" defaultValue={typeFilter} className={fieldControlStyles()} aria-label="買賣方向">
              <option value="">全部</option>
              <option value="BUY">買入</option>
              <option value="SELL">賣出</option>
              <option value="EXCHANGE">交換</option>
            </select>
          </label>
          <label className={fieldLabelStyles()}>
            <span className="w-full text-gray-400 sm:w-auto">
              <span className="zh-Hant">交易日區間</span>
              <span className="zh-Hans hidden">交易日区间</span>
            </span>
            <div className="flex gap-2">
              <input type="date" name="from" defaultValue={tradedFrom} className={fieldControlStyles()} aria-label="起日" />
              <input type="date" name="to" defaultValue={tradedTo} className={fieldControlStyles()} aria-label="迄日" />
            </div>
          </label>
          <label className={fieldLabelStyles()}>
            <span className="w-full text-gray-400 sm:w-auto">
              <span className="zh-Hant">排序欄位</span>
              <span className="zh-Hans hidden">排序栏位</span>
            </span>
            <select name="sort" defaultValue={sortKey} className={fieldControlStyles()} aria-label="排序欄位">
              <option value="traded_at">交易日</option>
              <option value="published_at">申報日</option>
              <option value="price">成交價</option>
              <option value="size_max">金額上限</option>
            </select>
          </label>
          <label className={fieldLabelStyles()}>
            <span className="w-full text-gray-400 sm:w-auto">
              <span className="zh-Hant">排序方向</span>
              <span className="zh-Hans hidden">排序方向</span>
            </span>
            <select name="order" defaultValue={order} className={fieldControlStyles()} aria-label="排序方向">
              <option value="desc">新 → 舊</option>
              <option value="asc">舊 → 新</option>
            </select>
          </label>
          <button className={`${actionStyles('secondary')} col-span-1`} type="submit" aria-label="套用篩選">
            <span className="zh-Hant">套用</span>
            <span className="zh-Hans hidden">应用</span>
          </button>
          <Link href="/trades" className={`${actionStyles('ghost')} col-span-1`}>
            <span className="zh-Hant">清除</span>
            <span className="zh-Hans hidden">清除</span>
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
                  <th className="px-3 py-2 text-left whitespace-nowrap">
                    <span className="zh-Hant">國會議員</span>
                    <span className="zh-Hans hidden">国会议员</span>
                  </th>
                  <th className="px-3 py-2 text-left whitespace-nowrap">
                    <span className="zh-Hant">上市公司</span>
                    <span className="zh-Hans hidden">上市公司</span>
                  </th>
                  <th className="px-3 py-2 text-left whitespace-nowrap">
                    <span className="zh-Hant">交易日</span>
                    <span className="zh-Hans hidden">交易日</span>
                  </th>
                  <th className="px-3 py-2 text-left whitespace-nowrap">
                    <span className="zh-Hant">申報日</span>
                    <span className="zh-Hans hidden">申报日</span>
                  </th>
                  <th className="px-3 py-2 text-left whitespace-nowrap">
                    <span className="zh-Hant">買賣</span>
                    <span className="zh-Hans hidden">买卖</span>
                  </th>
                  <th className="px-3 py-2 text-left whitespace-nowrap">
                    <span className="zh-Hant">金額區間（USD）</span>
                    <span className="zh-Hans hidden">金额区间（USD）</span>
                  </th>
                  <th className="px-3 py-2 text-left whitespace-nowrap">
                    <span className="zh-Hant">成交價</span>
                    <span className="zh-Hans hidden">成交价</span>
                  </th>
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
                    <td className="px-3 py-2 text-gray-300">{t.publishedAt ? new Date(t.publishedAt).toLocaleDateString('zh-TW') : '—'}</td>
                    <td className="px-3 py-2 text-gray-200">
                      <span className="font-medium text-white">{tradeTypeLabelZh(t.type)}</span>
                    </td>
                    <td className="px-3 py-2 text-gray-300">
                      {t.sizeMin && t.sizeMax
                        ? `US$${Math.round(Number(t.sizeMin)).toLocaleString('zh-TW')} – US$${Math.round(Number(t.sizeMax)).toLocaleString('zh-TW')}`
                        : '—'}
                    </td>
                    <td className="px-3 py-2 text-gray-300">
                      {t.price !== null ? `US$${Number(t.price).toLocaleString('zh-TW', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                    </td>
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


