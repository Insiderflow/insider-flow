import { prisma } from '@/lib/prisma';
import SortableIssuersTable from '@/components/SortableIssuersTable';
import LastUpdated, { DataFreshnessIndicator } from '@/components/LastUpdated';
import { getCurrentUserWithTier, isPaid } from '@/lib/membership';
import { redirect } from 'next/navigation';
import StateNotice from '@/components/StateNotice';
import { actionStyles } from '@/components/actionStyles';
import { fieldControlStyles, fieldLabelStyles } from '@/components/formStyles';
import { statSurfaceStyles } from '@/components/surfaceStyles';
import { pageTitleStyles } from '@/components/typographyStyles';
export const dynamic = 'force-dynamic';

type Row = {
  id: string;
  name: string;
  ticker: string | null;
  trades: number;
  politicians: number;
  volume: number;
  price: number | null;
  change30dPct: number | null;
  trend: 'up' | 'down' | 'flat' | 'na';
};

async function fetchTickerSnapshot(ticker: string): Promise<{ price: number | null; change30dPct: number | null; trend: Row['trend'] }> {
  const cleanTicker = ticker.trim().toUpperCase();
  if (!cleanTicker || cleanTicker === 'N/A') {
    return { price: null, change30dPct: null, trend: 'na' };
  }

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(cleanTicker)}?range=1mo&interval=1d`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
      next: { revalidate: 900 },
    });
    if (!response.ok) {
      return { price: null, change30dPct: null, trend: 'na' };
    }

    const data = await response.json();
    const result = data?.chart?.result?.[0];
    const closes: unknown[] = result?.indicators?.quote?.[0]?.close ?? [];
    const validCloses = closes
      .map((v) => (typeof v === 'number' ? v : Number(v)))
      .filter((v) => Number.isFinite(v));

    const latestClose = validCloses.length > 0 ? validCloses[validCloses.length - 1] : null;
    const firstClose = validCloses.length > 0 ? validCloses[0] : null;
    const price = typeof latestClose === 'number' && Number.isFinite(latestClose) ? latestClose : null;

    if (price === null || firstClose === null || firstClose === 0) {
      return { price, change30dPct: null, trend: price === null ? 'na' : 'flat' };
    }

    const change30dPct = ((price - firstClose) / firstClose) * 100;
    const trend: Row['trend'] = change30dPct > 0 ? 'up' : change30dPct < 0 ? 'down' : 'flat';
    return { price, change30dPct, trend };
  } catch {
    return { price: null, change30dPct: null, trend: 'na' };
  }
}

export default async function IssuersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const me = await getCurrentUserWithTier();
  if (!isPaid(me)) {
    redirect('/upgrade?reason=paid_required');
  }
  const sp = await searchParams;
  const allowedSort = new Set(['name', 'trades', 'politicians', 'volume', 'price', 'change30dPct']);
  const sortKeyRaw = typeof sp.sort === 'string' ? sp.sort : 'trades';
  const sortKey = allowedSort.has(sortKeyRaw) ? sortKeyRaw : 'trades';
  const order = (typeof sp.order === 'string' && sp.order.toLowerCase() === 'asc') ? 'asc' : 'desc';
  const pageSize = 50;
  const page = Math.max(1, Number(typeof sp.page === 'string' ? sp.page : 1) || 1);

  // Get issuers with trade counts using Prisma
  const issuers = await prisma.issuer.findMany({
    include: {
      Trade: {
        include: {
          Politician: true
        }
      }
    },
    take: pageSize,
    skip: (page - 1) * pageSize,
    orderBy: sortKey === 'name' ? { name: order } : undefined
  });

  // Transform to the expected format
  const rows: Row[] = issuers.map(issuer => {
    const trades = issuer.Trade;
    const politicians = new Set(trades.map(t => t.Politician.id)).size;
    const volume = trades.reduce((sum, trade) => {
      const avgSize = trade.size_min && trade.size_max ? 
        (Number(trade.size_min) + Number(trade.size_max)) / 2 : 0;
      return sum + avgSize;
    }, 0);

    return {
      id: issuer.id,
      name: issuer.name,
      ticker: issuer.ticker || 'N/A',
      trades: trades.length,
      politicians,
      volume,
      price: null,
      change30dPct: null,
      trend: 'na',
    };
  });

  // Sort the results (for computed columns)
  const tickerSnapshots = await Promise.all(
    rows.map(async (row) => {
      const snapshot = await fetchTickerSnapshot(row.ticker || '');
      return [row.ticker || '', snapshot] as const;
    })
  );
  const tickerSnapshotMap = new Map(tickerSnapshots);

  rows.forEach((row) => {
    const snapshot = tickerSnapshotMap.get(row.ticker || '');
    row.price = snapshot?.price ?? null;
    row.change30dPct = snapshot?.change30dPct ?? null;
    row.trend = snapshot?.trend ?? 'na';
  });

  rows.sort((a, b) => {
    const aVal = a[sortKey as keyof Row];
    const bVal = b[sortKey as keyof Row];
    
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return order === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    
    const numA = Number(aVal);
    const numB = Number(bVal);
    return order === 'asc' ? numA - numB : numB - numA;
  });
  const [tradeCount, polCount, issuerCount, lastTradeDate] = await Promise.all([
    prisma.trade.count(),
    prisma.politician.count(),
    prisma.issuer.count(),
    prisma.trade.findFirst({
      orderBy: { traded_at: 'desc' },
      select: { traded_at: true }
    }).then(result => result?.traded_at || new Date())
  ]);
  const totalPages = Math.max(1, Math.ceil(issuerCount / pageSize));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;
  const baseQS = new URLSearchParams(Object.entries(sp as Record<string,string|undefined>).filter(([k,v]) => k !== 'page' && typeof v === 'string') as [string,string][]);
  const prevHref = hasPrev ? `/issuers?${new URLSearchParams({ ...Object.fromEntries(baseQS), page: String(page - 1) }).toString()}` : '#';
  const nextHref = hasNext ? `/issuers?${new URLSearchParams({ ...Object.fromEntries(baseQS), page: String(page + 1) }).toString()}` : '#';
  return (
    <div className="min-h-screen bg-gray-900">
      <main className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className={pageTitleStyles()}>
            <span className="zh-Hant">發行商</span>
            <span className="zh-Hans hidden">发行商</span>
          </h1>
          <div className="flex items-center gap-2">
            <DataFreshnessIndicator timestamp={lastTradeDate} />
            <LastUpdated timestamp={lastTradeDate} className="text-xs text-gray-400" />
          </div>
        </div>
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className={statSurfaceStyles()}>
            <div className="text-xs text-white">
              <span className="zh-Hant">總交易</span>
              <span className="zh-Hans hidden">总交易</span>
            </div>
            <div className="text-lg sm:text-xl font-semibold text-white">{tradeCount}</div>
          </div>
          <div className={statSurfaceStyles()}>
            <div className="text-xs text-white">
              <span className="zh-Hant">政治家</span>
              <span className="zh-Hans hidden">政治家</span>
            </div>
            <div className="text-lg sm:text-xl font-semibold text-white">{polCount}</div>
          </div>
          <div className={statSurfaceStyles()}>
            <div className="text-xs text-white">
              <span className="zh-Hant">發行商</span>
              <span className="zh-Hans hidden">发行商</span>
            </div>
            <div className="text-lg sm:text-xl font-semibold text-white">{issuerCount}</div>
          </div>
        </section>
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs text-gray-300">
            <span className="zh-Hant">第 {page} 頁</span>
            <span className="zh-Hans hidden">第 {page} 页</span>
          </div>
          <div className="space-x-2">
            <a href={prevHref} aria-disabled={!hasPrev} className={`${actionStyles('secondary')} ${!hasPrev ? 'bg-gray-700 text-gray-400 border-gray-600 cursor-not-allowed hover:bg-gray-700 hover:text-gray-400' : ''}`} aria-label="Previous page">
              <span className="zh-Hant">上一頁</span>
              <span className="zh-Hans hidden">上一页</span>
            </a>
            <a href={nextHref} aria-disabled={!hasNext} className={`${actionStyles('secondary')} ${!hasNext ? 'bg-gray-700 text-gray-400 border-gray-600 cursor-not-allowed hover:bg-gray-700 hover:text-gray-400' : ''}`} aria-label="Next page">
              <span className="zh-Hant">下一頁</span>
              <span className="zh-Hans hidden">下一页</span>
            </a>
          </div>
        </div>
        <form className="flex flex-col sm:flex-row gap-3 mb-3" method="get">
          <label className={fieldLabelStyles()}>
            <span className="w-full sm:w-auto text-gray-400">
              <span className="zh-Hant">排序</span>
              <span className="zh-Hans hidden">排序</span>
            </span>
            <select name="sort" defaultValue={sortKey} className={fieldControlStyles()} aria-label="Sort by">
              <option value="trades">交易次數</option>
              <option value="politicians">政治家</option>
              <option value="volume">交易金額</option>
              <option value="price">價格</option>
              <option value="change30dPct">30天變化</option>
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
          <button className={actionStyles('ghost')} type="submit" aria-label="Apply filters">
            <span className="zh-Hant">套用</span>
            <span className="zh-Hans hidden">应用</span>
          </button>
        </form>
        {rows.length === 0 ? (
          <StateNotice
            title="沒有可顯示的發行商資料"
            description="目前沒有符合條件的發行商，請調整排序或稍後再試。"
          />
        ) : (
          <SortableIssuersTable
            issuers={rows.map((r) => ({
              id: r.id,
              name: r.name,
              ticker: r.ticker ?? '',
              trades: r.trades,
              politicians: r.politicians,
              volume: new Intl.NumberFormat('en-US').format(Math.round(r.volume)),
              price: r.price,
              change30dPct: r.change30dPct,
              trend: r.trend,
            }))}
          />
        )}
      </main>
    </div>
  );
}


