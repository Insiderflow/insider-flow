import { getCurrentUserWithTier, isPaid } from '@/lib/membership';
import StateNotice from '@/components/StateNotice';
import Link from 'next/link';
import PoliticianProfileImage from '@/components/PoliticianProfileImage';
import PoliticianCard from '@/components/PoliticianCard';
import { actionStyles } from '@/components/actionStyles';
import { fieldControlStyles, fieldLabelStyles } from '@/components/formStyles';
import { mutedLabelStyles, pageTitleStyles } from '@/components/typographyStyles';
import { getPoliticiansPageData, type PoliticianSortKey, type SortOrder } from '@/lib/repos/politiciansRepo';
import StatCard from '@/components/StatCard';
import FilterBar from '@/components/FilterBar';
import PaginationBar from '@/components/PaginationBar';
import LocalizedPlaceholderInput from '@/components/LocalizedPlaceholderInput';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function PoliticiansPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const me = await getCurrentUserWithTier();
  const sessionUser = await getSessionUser();
  const canAccessDetails = isPaid(me);
  const chamber = typeof sp.chamber === 'string' ? sp.chamber : '';
  const searchName = typeof sp.name === 'string' ? sp.name : '';
  const allowedSort = new Set<PoliticianSortKey>(['name', 'trades', 'volume', 'lastTraded']);
  const sortKeyRaw = typeof sp.sort === 'string' ? sp.sort : 'trades';
  const sortKey: PoliticianSortKey = allowedSort.has(sortKeyRaw as PoliticianSortKey) ? (sortKeyRaw as PoliticianSortKey) : 'trades';
  const order: SortOrder = typeof sp.order === 'string' && sp.order.toLowerCase() === 'asc' ? 'asc' : 'desc';
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

  const watchedSet = new Set<string>();
  if (sessionUser && rows.length) {
    const wl = await prisma.userWatchlist.findMany({
      where: {
        user_id: sessionUser.id,
        watchlist_type: 'politician',
        politician_id: { in: rows.map((r) => r.id) },
      },
      select: { politician_id: true },
    });
    for (const w of wl) {
      if (w.politician_id) watchedSet.add(w.politician_id);
    }
  }

  const topByVolumePoliticians = [...rows].sort((a, b) => b.totalVolume - a.totalVolume).slice(0, 5);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const tradeCount = rows.reduce((sum, r) => sum + r.trades, 0);
  const polCount = total;
  const issuerCount = rows.reduce((sum, r) => sum + r.issuers, 0);
  const politiciansQs = (p: number) =>
    `/politicians?${new URLSearchParams({
      page: String(p),
      ...(chamber ? { chamber } : {}),
      ...(searchName ? { name: searchName } : {}),
      sort: sortKey,
      order,
    }).toString()}`;

  return (
    <div className="min-h-screen bg-gray-900">
      <main className="p-4">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h1 className={pageTitleStyles()}>
            <span className="zh-Hant">國會議員</span>
            <span className="zh-Hans hidden">国会议员</span>
          <span className="ko hidden">국회의원</span>
          </h1>
          <div className={`text-sm ${mutedLabelStyles()}`}>
            <span className="zh-Hant">
              共 {total.toLocaleString('zh-TW')} 位 · 第 {page} / {totalPages} 頁
            </span>
            <span className="zh-Hans hidden">
              共 {total.toLocaleString('zh-CN')} 位 · 第 {page} / {totalPages} 页
            </span>
          <span className="ko hidden">의회의원</span>
          </div>
        </div>

        <section className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label={
              <>
                <span className="zh-Hant">本頁交易筆數</span>
                <span className="zh-Hans hidden">本页交易笔数</span>
          <span className="ko hidden">共 {total.toLocaleString('zh-TW')} 位 · 第 {page} / {totalPages} 페이지</span>
              </>
            }
            value={tradeCount.toLocaleString('zh-TW')}
          />
          <StatCard
            label={
              <>
                <span className="zh-Hant">名單人數</span>
                <span className="zh-Hans hidden">名单人数</span>
          <span className="ko hidden">本페이지거래筆數</span>
              </>
            }
            value={polCount.toLocaleString('zh-TW')}
          />
          <StatCard
            label={
              <>
                <span className="zh-Hant">本頁涉及公司（次）</span>
                <span className="zh-Hans hidden">本页涉及公司（次）</span>
          <span className="ko hidden">이 페이지 관련 회사（건）</span>
              </>
            }
            value={issuerCount.toLocaleString('zh-TW')}
          />
        </section>

        <section className="mb-6">
          <h2 className="mb-3 text-xl font-semibold text-white">
            <span className="zh-Hant">成交金額 Top 5</span>
            <span className="zh-Hans hidden">成交金额 Top 5</span>
          <span className="ko hidden">本페이지涉及회사（次）</span>
          </h2>
          <div className="rounded-lg border border-gray-600 bg-gray-800 p-4 shadow-md">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5">
              {topByVolumePoliticians.map((politician) => {
                const detailHref = canAccessDetails ? `/politicians/${politician.id}` : '/upgrade?reason=paid_required';
                return (
                  <Link
                    key={politician.id}
                    href={detailHref}
                    className="flex items-center gap-3 rounded-md border border-gray-700 bg-gray-900 p-3 transition-colors hover:border-gray-500"
                  >
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gray-700">
                      <PoliticianProfileImage
                        politicianId={politician.id}
                        politicianName={politician.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-medium text-white">{politician.name}</div>
                      <div className="mt-1 truncate text-xs text-gray-400">
                        {politician.party ? `${partyShort(politician.party)}` : '—'}{' '}
                        {politician.chamber ? `· ${chamberShort(politician.chamber)}` : ''}
                      </div>
                      <div className="mt-2 text-sm text-blue-300">
                        <span className="zh-Hant">金額</span>
                        <span className="zh-Hans hidden">金额</span>
          <span className="ko hidden">금액</span>
                        ：US$
                        {new Intl.NumberFormat('zh-TW').format(Math.round(politician.totalVolume))}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <FilterBar className="mb-3" action="/politicians">
          <label className={fieldLabelStyles()}>
            <span className="w-full text-gray-400 sm:w-auto">
              <span className="zh-Hant">搜尋姓名</span>
              <span className="zh-Hans hidden">搜索姓名</span>
          <span className="ko hidden">이름 검색</span>
            </span>
            <LocalizedPlaceholderInput
              name="name"
              defaultValue={searchName}
              placeholderKey="searchPoliticianNamePlaceholder"
              className={fieldControlStyles()}
              aria-label="依議員姓名搜尋"
            />
          </label>
          <label className={fieldLabelStyles()}>
            <span className="w-full text-gray-400 sm:w-auto">
              <span className="zh-Hant">議院</span>
              <span className="zh-Hans hidden">议院</span>
          <span className="ko hidden">원</span>
            </span>
            <select name="chamber" defaultValue={chamber} className={fieldControlStyles()} aria-label="依議院篩選">
              <option value="">全部</option>
              <option value="House">眾議院</option>
              <option value="Senate">參議院</option>
            </select>
          </label>
          <label className={fieldLabelStyles()}>
            <span className="w-full text-gray-400 sm:w-auto">
              <span className="zh-Hant">排序</span>
              <span className="zh-Hans hidden">排序</span>
          <span className="ko hidden">정렬</span>
            </span>
            <select name="sort" defaultValue={sortKey} className={fieldControlStyles()} aria-label="排序欄位">
              <option value="trades">交易筆數</option>
              <option value="volume">成交金額</option>
              <option value="lastTraded">最後交易日期</option>
              <option value="name">姓名</option>
            </select>
          </label>
          <label className={fieldLabelStyles()}>
            <span className="w-full text-gray-400 sm:w-auto">
              <span className="zh-Hant">順序</span>
              <span className="zh-Hans hidden">顺序</span>
          <span className="ko hidden">정렬</span>
            </span>
            <select name="order" defaultValue={order} className={fieldControlStyles()} aria-label="升冪或降冪">
              <option value="asc">升序</option>
              <option value="desc">降序</option>
            </select>
          </label>
          <button className={actionStyles('ghost')} type="submit" aria-label="套用篩選">
            <span className="zh-Hant">套用</span>
            <span className="zh-Hans hidden">应用</span>
          <span className="ko hidden">적용</span>
          </button>
        </FilterBar>

        <PaginationBar
          page={page}
          totalPages={totalPages}
          prevHref={politiciansQs(Math.max(1, page - 1))}
          nextHref={politiciansQs(Math.min(totalPages, page + 1))}
          getPageHref={politiciansQs}
          className="mb-4"
        />

        {rows.length === 0 ? (
          <StateNotice
            title="沒有符合條件的議員"
            description="請調整搜尋或議院篩選後再試。"
            actions={
              <Link href="/politicians" className={actionStyles('primary')}>
                清除篩選
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {rows.map((politician) => {
              const detailHref = canAccessDetails ? `/politicians/${politician.id}` : '/upgrade?reason=paid_required';
              return (
                <PoliticianCard
                  key={politician.id}
                  politician={{
                    id: politician.id,
                    name: politician.name,
                    party: politician.party,
                    chamber: politician.chamber,
                    state: politician.state,
                    trades: politician.trades,
                    issuers: politician.issuers,
                    totalVolume: politician.totalVolume,
                    lastTraded: politician.lastTraded,
                  }}
                  detailHref={detailHref}
                  userId={sessionUser?.id}
                  initialInWatchlist={watchedSet.has(politician.id)}
                />
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function partyShort(party: string) {
  const u = party.toLowerCase();
  if (u.includes('democrat')) return '民主黨';
  if (u.includes('republican')) return '共和黨';
  return party;
}

function chamberShort(chamber: string) {
  const u = chamber.toLowerCase();
  if (u === 'house' || u.includes('house')) return '眾議院';
  if (u === 'senate' || u.includes('senate')) return '參議院';
  return chamber;
}
