import Link from 'next/link';
import { getCurrentUserWithTier, isPaid } from '@/lib/membership';
import StateNotice from '@/components/StateNotice';
import { actionStyles } from '@/components/actionStyles';
import { fieldControlStyles, fieldLabelStyles } from '@/components/formStyles';
import { bodySubtextStyles, pageTitleStyles } from '@/components/typographyStyles';
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
  const issuersQs = (p: number) =>
    `/issuers?${new URLSearchParams({ ...Object.fromEntries(baseQS), page: String(p) }).toString()}`;
  const prevHref = issuersQs(Math.max(1, page - 1));
  const nextHref = issuersQs(Math.min(totalPages, page + 1));
  return (
    <div className="min-h-screen bg-gray-900">
      <main className="p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-start mb-2">
          <h1 className={pageTitleStyles()}>
            <span className="zh-Hant">上市公司</span>
            <span className="zh-Hans hidden">上市公司</span>
          <span className="ko hidden">상장사</span>
          </h1>
          <div className="text-sm text-gray-300 whitespace-nowrap">
            <span className="zh-Hant">共 {total.toLocaleString('zh-TW')} 家</span>
            <span className="zh-Hans hidden">共 {total.toLocaleString('zh-CN')} 家</span>
          <span className="ko hidden">上市회사</span>
          </div>
        </div>
        <p className={`${bodySubtextStyles()} mb-4 text-sm sm:text-base`}>
          <span className="zh-Hant">點公司名稱可進入該標的的交易明細（付費解鎖）。</span>
          <span className="zh-Hans hidden">点击公司名称可进入该标的的交易明细（付费解锁）。</span>
          <span className="ko hidden">회사명 클릭 시 해당 종목 거래 상세（유료 잠금 해제）.</span>
        </p>
        <PaginationBar
          page={page}
          totalPages={totalPages}
          prevHref={prevHref}
          nextHref={nextHref}
          getPageHref={issuersQs}
          className="mb-3"
        />
        <FilterBar className="mb-3" action="/issuers">
          <label className={fieldLabelStyles()}>
            <span className="w-full text-gray-400 sm:w-auto">
              <span className="zh-Hant">搜尋</span>
              <span className="zh-Hans hidden">搜索</span>
          <span className="ko hidden">點회사名稱可進入該標的的거래明細（付費解鎖）。</span>
            </span>
            <input
              name="q"
              defaultValue={q}
              placeholder="公司名稱或股票代號…"
              className={fieldControlStyles()}
              aria-label="搜尋公司"
            />
          </label>
          <label className={fieldLabelStyles()}>
            <span className="w-full text-gray-400 sm:w-auto">
              <span className="zh-Hant">排序欄位</span>
              <span className="zh-Hans hidden">排序栏位</span>
          <span className="ko hidden">정렬 항목</span>
            </span>
            <select name="sort" defaultValue={sortKey} className={fieldControlStyles()} aria-label="排序欄位">
              <option value="trades">交易筆數</option>
              <option value="politicians">涉及議員人數</option>
              <option value="volume">成交金額總額</option>
              <option value="lastTraded">最後交易日</option>
              <option value="price">股價</option>
              <option value="change30dPct">近 30 日漲跌</option>
              <option value="name">公司名稱</option>
            </select>
          </label>
          <label className={fieldLabelStyles()}>
            <span className="w-full text-gray-400 sm:w-auto">
              <span className="zh-Hant">排序方向</span>
              <span className="zh-Hans hidden">排序方向</span>
          <span className="ko hidden">정렬欄位</span>
            </span>
            <select name="order" defaultValue={order} className={fieldControlStyles()} aria-label="排序方向">
              <option value="desc">高 → 低</option>
              <option value="asc">低 → 高</option>
            </select>
          </label>
          <button className={actionStyles('secondary')} type="submit" aria-label="套用篩選">
            <span className="zh-Hant">套用</span>
            <span className="zh-Hans hidden">应用</span>
          <span className="ko hidden">정렬方向</span>
          </button>
          <Link href="/issuers" className={actionStyles('ghost')}>
            <span className="zh-Hant">清除</span>
            <span className="zh-Hans hidden">清除</span>
          <span className="ko hidden">지우기</span>
          </Link>
        </FilterBar>
        {rows.length === 0 ? (
          <StateNotice
            title={
              <>
                <span className="zh-Hant">沒有符合條件的公司</span>
                <span className="zh-Hans hidden">没有符合条件的公司</span>
          <span className="ko hidden">지우기</span>
              </>
            }
            description={
              <>
                <span className="zh-Hant">請調整搜尋或排序，或清除篩選後再試。</span>
                <span className="zh-Hans hidden">请调整搜索或排序，或清除筛选后再试。</span>
          <span className="ko hidden">沒有符合條件的회사</span>
              </>
            }
            actions={
              <Link href="/issuers" className={actionStyles('primary')}>
                <span className="zh-Hant">清除篩選</span>
                <span className="zh-Hans hidden">清除筛选</span>
          <span className="ko hidden">請調整搜尋或정렬，或지우기필터後再試。</span>
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-700">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-800 text-gray-300">
                <tr>
                  <th className="px-3 py-2 text-left whitespace-nowrap">
                    <span className="zh-Hant">公司</span>
                    <span className="zh-Hans hidden">公司</span>
          <span className="ko hidden">지우기필터</span>
                  </th>
                  <th className="px-3 py-2 text-left whitespace-nowrap">
                    <span className="zh-Hant">代號</span>
                    <span className="zh-Hans hidden">代号</span>
          <span className="ko hidden">회사</span>
                  </th>
                  <th className="px-3 py-2 text-left whitespace-nowrap">
                    <span className="zh-Hant">交易筆數</span>
                    <span className="zh-Hans hidden">交易笔数</span>
          <span className="ko hidden">거래 건수</span>
                  </th>
                  <th className="px-3 py-2 text-left whitespace-nowrap">
                    <span className="zh-Hant">議員人數</span>
                    <span className="zh-Hans hidden">议员人数</span>
          <span className="ko hidden">거래 건수</span>
                  </th>
                  <th className="px-3 py-2 text-left whitespace-nowrap">
                    <span className="zh-Hant">成交總額（USD）</span>
                    <span className="zh-Hans hidden">成交总额（USD）</span>
          <span className="ko hidden">의원人數</span>
                  </th>
                  <th className="px-3 py-2 text-left whitespace-nowrap">
                    <span className="zh-Hant">最後交易日</span>
                    <span className="zh-Hans hidden">最后交易日</span>
          <span className="ko hidden">최종 거래일</span>
                  </th>
                  <th className="px-3 py-2 text-left whitespace-nowrap">
                    <span className="zh-Hant">股價</span>
                    <span className="zh-Hans hidden">股价</span>
          <span className="ko hidden">最後거래日</span>
                  </th>
                  <th className="px-3 py-2 text-left whitespace-nowrap">
                    <span className="zh-Hant">近 30 日</span>
                    <span className="zh-Hans hidden">近 30 日</span>
          <span className="ko hidden">최근 30일</span>
                  </th>
                  <th className="px-3 py-2 text-left whitespace-nowrap">
                    <span className="zh-Hant">走勢</span>
                    <span className="zh-Hans hidden">走势</span>
          <span className="ko hidden">추세</span>
                  </th>
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
                    <td className="px-3 py-2 text-gray-300">{issuer.ticker || '—'}</td>
                    <td className="px-3 py-2 text-gray-300">{issuer.trades.toLocaleString('zh-TW')}</td>
                    <td className="px-3 py-2 text-gray-300">{issuer.politicians.toLocaleString('zh-TW')}</td>
                    <td className="px-3 py-2 text-gray-300">
                      US${Math.round(issuer.totalVolume).toLocaleString('zh-TW')}
                    </td>
                    <td className="px-3 py-2 text-gray-300">
                      {issuer.lastTraded ? issuer.lastTraded.toLocaleDateString('zh-TW') : '—'}
                    </td>
                    <td className="px-3 py-2 text-gray-300">
                      {issuer.price !== null ? (
                        `US$${Number(issuer.price).toLocaleString('zh-TW', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      ) : (
                        <>
                          <span className="zh-Hant">未揭露</span>
                          <span className="zh-Hans hidden">未披露</span>
          <span className="ko hidden">미공시</span>
                        </>
                      )}
                    </td>
                    <td className={`px-3 py-2 ${issuer.change30dPct !== null ? (issuer.change30dPct >= 0 ? 'text-green-400' : 'text-red-400') : 'text-gray-300'}`}>
                      {issuer.change30dPct !== null ? (
                        `${issuer.change30dPct >= 0 ? '+' : ''}${issuer.change30dPct.toFixed(2)}%`
                      ) : (
                        <>
                          <span className="zh-Hant">未揭露</span>
                          <span className="zh-Hans hidden">未披露</span>
          <span className="ko hidden">미공시</span>
                        </>
                      )}
                    </td>
                    <td className="px-3 py-2 text-gray-300">
                      {issuer.trend === 'up' ? (
                        <>
                          <span className="zh-Hant">上升</span>
                          <span className="zh-Hans hidden">上升</span>
          <span className="ko hidden">상승</span>
                        </>
                      ) : issuer.trend === 'down' ? (
                        <>
                          <span className="zh-Hant">下跌</span>
                          <span className="zh-Hans hidden">下跌</span>
          <span className="ko hidden">하락</span>
                        </>
                      ) : issuer.trend === 'flat' ? (
                        <>
                          <span className="zh-Hant">持平</span>
                          <span className="zh-Hans hidden">持平</span>
          <span className="ko hidden">보합</span>
                        </>
                      ) : (
                        <>
                          <span className="zh-Hant">未揭露</span>
                          <span className="zh-Hans hidden">未披露</span>
          <span className="ko hidden">미공시</span>
                        </>
                      )}
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