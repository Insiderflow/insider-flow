import Link from 'next/link';
import { getCurrentUserWithTier, isPaid } from '@/lib/membership';
import StateNotice from '@/components/StateNotice';
import { actionStyles } from '@/components/actionStyles';
import { fieldControlStyles, fieldLabelStyles } from '@/components/formStyles';
import { pageTitleStyles } from '@/components/typographyStyles';
import { textLinkStyles } from '@/components/linkStyles';
import { getIssuersPageData, type SortOrder } from '@/lib/repos/issuersRepo';
import FilterBar from '@/components/FilterBar';
import PaginationBar from '@/components/PaginationBar';

export const dynamic = 'force-dynamic';

export default async function IssuersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const me = await getCurrentUserWithTier();
  const canAccessDetails = isPaid(me);
  const sp = await searchParams;
  const allowedSort = new Set(['name', 'trades', 'politicians', 'volume', 'lastTraded', 'price', 'change30dPct']);
  const sortKeyRaw = typeof sp.sort === 'string' ? sp.sort : 'trades';
  const sortKey = allowedSort.has(sortKeyRaw) ? sortKeyRaw : 'trades';
  const order: SortOrder = (typeof sp.order === 'string' && sp.order.toLowerCase() === 'asc') ? 'asc' : 'desc';
  const q = typeof sp.q === 'string' ? sp.q : '';
  const pageSize = 30;
  const page = Math.max(1, Number(typeof sp.page === 'string' ? sp.page : 1) || 1);

  const { rows, total } = await getIssuersPageData({
    page,
    pageSize,
    query: q || undefined,
    sortBy: sortKey as 'name' | 'trades' | 'politicians' | 'volume' | 'lastTraded' | 'price' | 'change30dPct',
    order,
  });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const baseQS = new URLSearchParams(Object.entries(sp as Record<string,string|undefined>).filter(([k,v]) => k !== 'page' && typeof v === 'string') as [string,string][]);
  const prevHref = `/issuers?${new URLSearchParams({ ...Object.fromEntries(baseQS), page: String(Math.max(1, page - 1)) }).toString()}`;
  const nextHref = `/issuers?${new URLSearchParams({ ...Object.fromEntries(baseQS), page: String(Math.min(totalPages, page + 1)) }).toString()}`;
  return (
    <div className="min-h-screen bg-gray-900">
      <main className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className={pageTitleStyles()}>
            <span className="zh-Hant">發行商</span>
            <span className="zh-Hans hidden">发行商</span>
          </h1>
          <div className="text-sm text-gray-300">共 {total.toLocaleString('en-US')} 家</div>
        </div>
        <PaginationBar page={page} totalPages={totalPages} prevHref={prevHref} nextHref={nextHref} className="mb-3" />
        <FilterBar className="mb-3">
          <label className={fieldLabelStyles()}>
            <span className="w-full sm:w-auto text-gray-400">搜尋</span>
            <input name="q" defaultValue={q} placeholder="公司名稱 / 代碼" className={fieldControlStyles()} />
          </label>
          <label className={fieldLabelStyles()}>
            <span className="w-full sm:w-auto text-gray-400">
              <span className="zh-Hant">排序</span>
              <span className="zh-Hans hidden">排序</span>
            </span>
            <select name="sort" defaultValue={sortKey} className={fieldControlStyles()} aria-label="Sort by">
              <option value="trades">交易次數</option>
              <option value="politicians">政治家</option>
              <option value="volume">交易金額</option>
              <option value="lastTraded">最後交易</option>
              <option value="price">價格</option>
              <option value="change30dPct">近30天表現</option>
              <option value="name">名稱</option>
            </select>
          </label>
          <label className={fieldLabelStyles()}>
            <span className="w-full sm:w-auto text-gray-400">
              <span className="zh-Hant">方向</span>
              <span className="zh-Hans hidden">方向</span>
            </span>
            <select name="order" defaultValue={order} className={fieldControlStyles()} aria-label="Sort order">
              <option value="desc">高到低</option>
              <option value="asc">低到高</option>
            </select>
          </label>
          <button className={actionStyles('secondary')} type="submit" aria-label="Apply filters">
            <span className="zh-Hant">套用</span>
            <span className="zh-Hans hidden">应用</span>
          </button>
        </FilterBar>
        {rows.length === 0 ? (
          <StateNotice
            title="沒有可顯示的發行商資料"
            description="目前沒有符合條件的發行商，請調整排序或稍後再試。"
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-700">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-800 text-gray-300">
                <tr>
                  <th className="px-3 py-2 text-left">發行商</th>
                  <th className="px-3 py-2 text-left">代碼</th>
                  <th className="px-3 py-2 text-left">交易次數</th>
                  <th className="px-3 py-2 text-left">交易議員</th>
                  <th className="px-3 py-2 text-left">交易總額</th>
                  <th className="px-3 py-2 text-left">最後交易</th>
                  <th className="px-3 py-2 text-left">價格</th>
                  <th className="px-3 py-2 text-left">近30天表現</th>
                  <th className="px-3 py-2 text-left">走勢</th>
                </tr>
              </thead>
              <tbody className="bg-gray-900">
                {rows.map((issuer) => {
                  const detailHref = canAccessDetails ? `/issuers/${issuer.id}` : '/upgrade?reason=paid_required';
                  return (
                  <tr key={issuer.id} className="border-t border-gray-800">
                    <td className="px-3 py-2">
                      <Link href={detailHref} className={textLinkStyles()}>
                        {issuer.name}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-gray-300">{issuer.ticker || '-'}</td>
                    <td className="px-3 py-2 text-gray-300">{issuer.trades.toLocaleString('en-US')}</td>
                    <td className="px-3 py-2 text-gray-300">{issuer.politicians.toLocaleString('en-US')}</td>
                    <td className="px-3 py-2 text-gray-300">${Math.round(issuer.totalVolume).toLocaleString('en-US')}</td>
                    <td className="px-3 py-2 text-gray-300">
                      {issuer.lastTraded ? issuer.lastTraded.toLocaleDateString('zh-TW') : '-'}
                    </td>
                    <td className="px-3 py-2 text-gray-300">
                      {issuer.price !== null ? `$${issuer.price.toFixed(2)}` : '未揭露'}
                    </td>
                    <td className={`px-3 py-2 ${issuer.change30dPct !== null ? (issuer.change30dPct >= 0 ? 'text-green-400' : 'text-red-400') : 'text-gray-300'}`}>
                      {issuer.change30dPct !== null ? `${issuer.change30dPct >= 0 ? '+' : ''}${issuer.change30dPct.toFixed(2)}%` : '未揭露'}
                    </td>
                    <td className="px-3 py-2 text-gray-300">
                      {issuer.trend === 'up' ? '上升' : issuer.trend === 'down' ? '下跌' : issuer.trend === 'flat' ? '持平' : '未揭露'}
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