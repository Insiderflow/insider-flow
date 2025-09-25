import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import ClearFiltersButton from '@/components/ClearFiltersButton';
import AutocompleteInput from '@/components/AutocompleteInput';
import SortableTradesTable from '@/components/SortableTradesTable';
import LoadingWrapper from '@/components/LoadingWrapper';
import LoadingSpinner from '@/components/LoadingSpinner';
import { StatsCardSkeleton, TableSkeleton } from '@/components/SkeletonLoader';
import LastUpdated, { DataFreshnessIndicator } from '@/components/LastUpdated';

export const dynamic = 'force-dynamic';

export default async function TradesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const pageSize = 50;
  const page = Math.max(1, Number(typeof sp.page === 'string' ? sp.page : 1) || 1);
  const allowedSort = new Set(['tradedAt', 'publishedAt', 'price', 'sizeMax']);
  const order = (typeof sp.order === 'string' && sp.order.toLowerCase() === 'asc') ? 'asc' : 'desc';
  const sortKeyRaw = typeof sp.sort === 'string' ? sp.sort : 'tradedAt';
  const sortKey = allowedSort.has(sortKeyRaw) ? sortKeyRaw : 'tradedAt';
  const qPolitician = typeof sp.qp === 'string' ? sp.qp : '';
  const qIssuer = typeof sp.qi === 'string' ? sp.qi : '';
  const typeFilter = typeof sp.type === 'string' ? sp.type : '';
  const ownerFilter = typeof sp.owner === 'string' ? sp.owner : '';
  const sizeMin = typeof sp.smin === 'string' && sp.smin !== '' ? Number(sp.smin) : undefined;
  const sizeMax = typeof sp.smax === 'string' && sp.smax !== '' ? Number(sp.smax) : undefined;
  const priceMin = typeof sp.pmin === 'string' && sp.pmin !== '' ? Number(sp.pmin) : undefined;
  const priceMax = typeof sp.pmax === 'string' && sp.pmax !== '' ? Number(sp.pmax) : undefined;

  const orderBy: Record<string, 'asc' | 'desc'> = {};
  orderBy[sortKey] = order;

  type TradeWhere = {
    politician?: { is: { name: { contains: string; mode: 'insensitive' } } };
    issuer?: { is: { name: { contains: string; mode: 'insensitive' } } };
    type?: string;
    owner?: string;
    AND?: Array<Record<string, unknown>>;
  };
  const where: TradeWhere = {};
  if (qPolitician) where.politician = { is: { name: { contains: qPolitician, mode: 'insensitive' } } };
  if (qIssuer) where.issuer = { is: { name: { contains: qIssuer, mode: 'insensitive' } } };
  if (typeFilter === 'buy' || typeFilter === 'sell') where.type = typeFilter.toUpperCase();
  if (ownerFilter) where.owner = ownerFilter;
  if (sizeMin != null || sizeMax != null) {
    // inclusive bounds on size range using sizeMax/sizeMin
    where.AND = where.AND || [];
    if (sizeMin != null) where.AND.push({ sizeMax: { gte: sizeMin } });
    if (sizeMax != null) where.AND.push({ sizeMin: { lte: sizeMax } });
  }
  if (priceMin != null || priceMax != null) {
    where.AND = where.AND || [];
    if (priceMin != null) where.AND.push({ price: { gte: priceMin } });
    if (priceMax != null) where.AND.push({ price: { lte: priceMax } });
  }

  // Fetch page of trades
  const trades = await prisma.trade.findMany({
    where,
    orderBy,
    take: pageSize,
    skip: (page - 1) * pageSize,
    include: { politician: true, issuer: true },
  });

  // Global aggregates for the current filter set
  const [totalCount, distinctPoliticians, distinctIssuers, lastTradeDate] = await Promise.all([
    prisma.trade.count({ where }),
    prisma.trade.groupBy({ by: ['politicianId'], where }),
    prisma.trade.groupBy({ by: ['issuerId'], where }),
    prisma.trade.findFirst({
      orderBy: { tradedAt: 'desc' },
      select: { tradedAt: true }
    }).then(result => result?.tradedAt || new Date())
  ]);
  const tradeCount = totalCount;
  const polCount = distinctPoliticians.length;
  const issuerCount = distinctIssuers.length;

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
          <h1 className="text-xl sm:text-2xl font-semibold text-white">
            <span className="zh-Hant">股票交易</span>
            <span className="zh-Hans hidden">股票交易</span>
          </h1>
          <div className="flex items-center gap-2">
            <DataFreshnessIndicator timestamp={lastTradeDate} />
            <LastUpdated timestamp={lastTradeDate} className="text-xs text-gray-400" />
          </div>
        </div>
        <p className="text-gray-300 mb-4 text-sm sm:text-base">
          <span className="zh-Hant">追蹤國會股票交易動態</span>
          <span className="zh-Hans hidden">追踪国会股票交易动态</span>
        </p>
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
        <div className="mb-2">
          <ClearFiltersButton formId="trades-filters" />
        </div>
        <form id="trades-filters" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3" method="get">
          <label className="text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-white">
            <span className="w-full sm:w-28 text-gray-400">
              <span className="zh-Hant">按政治家</span>
              <span className="zh-Hans hidden">按政治家</span>
            </span>
            <AutocompleteInput name="qp" initialValue={qPolitician} placeholder="Name" searchPath="/api/suggest/politicians" ariaLabel="Politician name filter" />
          </label>
          <label className="text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-white">
            <span className="w-full sm:w-24 text-gray-400">
              <span className="zh-Hant">按發行商</span>
              <span className="zh-Hans hidden">按发行商</span>
            </span>
            <AutocompleteInput name="qi" initialValue={qIssuer} placeholder="公司/代碼" searchPath="/api/suggest/issuers" ariaLabel="Issuer name filter" />
          </label>
          <label className="text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-white">
            <span className="w-full sm:w-auto text-gray-400">
              <span className="zh-Hant">排序</span>
              <span className="zh-Hans hidden">排序</span>
            </span>
            <select name="sort" defaultValue={sortKey} className="border border-gray-600 p-1 bg-gray-800 text-white text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors duration-200" aria-label="Sort by">
              <option value="tradedAt">交易日期</option>
              <option value="publishedAt">發布日期</option>
              <option value="price">價格</option>
              <option value="sizeMax">金額(上限)</option>
            </select>
          </label>
          <label className="text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-white">
            <span className="w-full sm:w-auto text-gray-400">
              <span className="zh-Hant">方向</span>
              <span className="zh-Hans hidden">方向</span>
            </span>
            <select name="order" defaultValue={order} className="border border-gray-600 p-1 bg-gray-800 text-white text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors duration-200" aria-label="Sort order">
              <option value="desc">新到舊</option>
              <option value="asc">舊到新</option>
            </select>
          </label>
          <label className="text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-white">
            <span className="w-full sm:w-20 text-gray-400">
              <span className="zh-Hant">類型</span>
              <span className="zh-Hans hidden">类型</span>
            </span>
            <select name="type" defaultValue={typeFilter} className="border border-gray-600 p-1 bg-gray-800 text-white text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors duration-200" aria-label="Trade type filter">
              <option value="">
                <span className="zh-Hant">全部</span>
                <span className="zh-Hans hidden">全部</span>
              </option>
            <option value="buy">
              <span className="zh-Hant">買入</span>
              <span className="zh-Hans hidden">买入</span>
            </option>
            <option value="sell">
              <span className="zh-Hant">賣出</span>
              <span className="zh-Hans hidden">卖出</span>
            </option>
          </select>
        </label>
          <label className="text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-white">
            <span className="w-full sm:w-20 text-gray-400">
              <span className="zh-Hant">持有人</span>
              <span className="zh-Hans hidden">持有人</span>
            </span>
            <select name="owner" defaultValue={ownerFilter} className="border border-gray-600 p-1 bg-gray-800 text-white text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors duration-200" aria-label="Owner filter">
              <option value="">
                <span className="zh-Hant">全部</span>
                <span className="zh-Hans hidden">全部</span>
              </option>
              <option value="Self">
                <span className="zh-Hant">本人</span>
                <span className="zh-Hans hidden">本人</span>
              </option>
              <option value="Spouse">
                <span className="zh-Hant">配偶</span>
                <span className="zh-Hans hidden">配偶</span>
              </option>
              <option value="Joint">
                <span className="zh-Hant">共同</span>
                <span className="zh-Hans hidden">共同</span>
              </option>
              <option value="Undisclosed">
                <span className="zh-Hant">未披露</span>
                <span className="zh-Hans hidden">未披露</span>
              </option>
            </select>
          </label>
          <label className="text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-white">
            <span className="w-full sm:w-28 text-gray-400">
              <span className="zh-Hant">金額範圍</span>
              <span className="zh-Hans hidden">金额范围</span>
            </span>
            <div className="flex gap-1">
              <input name="smin" type="number" inputMode="numeric" placeholder="最低" defaultValue={sizeMin ?? ''} className="border border-gray-600 p-1 w-20 sm:w-24 bg-gray-800 text-white placeholder-gray-400 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors duration-200" aria-label="Minimum size" />
              <input name="smax" type="number" inputMode="numeric" placeholder="最高" defaultValue={sizeMax ?? ''} className="border border-gray-600 p-1 w-20 sm:w-24 bg-gray-800 text-white placeholder-gray-400 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors duration-200" aria-label="Maximum size" />
            </div>
          </label>
          <label className="text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-white">
            <span className="w-full sm:w-24 text-gray-400">
              <span className="zh-Hant">價格</span>
              <span className="zh-Hans hidden">价格</span>
            </span>
            <div className="flex gap-1">
              <input name="pmin" type="number" step="0.01" placeholder="最低" defaultValue={priceMin ?? ''} className="border border-gray-600 p-1 w-20 sm:w-24 bg-gray-800 text-white placeholder-gray-400 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors duration-200" aria-label="Minimum price" />
              <input name="pmax" type="number" step="0.01" placeholder="最高" defaultValue={priceMax ?? ''} className="border border-gray-600 p-1 w-20 sm:w-24 bg-gray-800 text-white placeholder-gray-400 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors duration-200" aria-label="Maximum price" />
            </div>
          </label>
          <button className="bg-white text-purple-600 border border-white px-3 sm:px-4 py-2 rounded hover:bg-purple-100 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none text-xs sm:text-sm col-span-1 sm:col-span-2 lg:col-span-1 transition-colors duration-200" type="submit" aria-label="Apply filters">
            <span className="zh-Hant">套用</span>
            <span className="zh-Hans hidden">应用</span>
          </button>
        </form>
        <LoadingWrapper fallback={<TableSkeleton rows={10} />}>
          <SortableTradesTable
            trades={trades.map((t) => ({
              id: t.id,
              politician: <Link className="text-blue-300 hover:text-blue-100 underline" href={`/politicians/${t.politicianId}`}>{t.politician.name}</Link>,
              issuer: <Link className="text-blue-300 hover:text-blue-100 underline" href={`/issuers/${t.issuerId}`}>{t.issuer.name}</Link>,
              publishedAt: t.publishedAt ? new Date(t.publishedAt).toISOString().slice(0, 10) : '',
              tradedAt: new Date(t.tradedAt).toISOString().slice(0, 10),
              filedAfterDays: t.filedAfterDays ?? '',
              owner: t.owner ?? '',
              type: <span className={`px-2 py-0.5 rounded text-xs ${t.type?.toUpperCase() === 'BUY' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>{t.type}</span>,
              size: t.sizeMin && t.sizeMax ? `${t.sizeMin.toString()}–${t.sizeMax.toString()}` : t.sizeMin ? t.sizeMin.toString() : '',
              price: t.price ? new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(Number(t.price)) : '',
            }))}
          />
        </LoadingWrapper>
      </main>
    </div>
  );
}


