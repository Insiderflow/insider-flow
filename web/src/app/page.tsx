 

import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import LoadingWrapper from '@/components/LoadingWrapper';
import LoadingSpinner as _LoadingSpinner from '@/components/LoadingSpinner';
import HomePoliticianImage from '@/components/HomePoliticianImage';
import { StatsCardSkeleton } from '@/components/SkeletonLoader';
import LastUpdated, { DataFreshnessIndicator } from '@/components/LastUpdated';
import PoliticianCard from '@/components/PoliticianCard';
export const dynamic = 'force-dynamic';

export default async function Home() {
  // Latest 5 trades, excluding Michael McCaul and prioritizing Aug-Sep 2025
  const periodStart = new Date('2025-08-01T00:00:00Z');
  const periodEnd = new Date('2025-09-30T23:59:59Z');

  const primaryTrades = await prisma.trade.findMany({
    where: {
      tradedAt: { gte: periodStart, lte: periodEnd },
      politician: { name: { not: 'Michael McCaul' } },
    },
    orderBy: { tradedAt: 'desc' },
    take: 5,
    include: { politician: true, issuer: true },
  });

  let latestTrades = primaryTrades;
  if (latestTrades.length < 5) {
    const filled = await prisma.trade.findMany({
      where: {
        politician: { name: { not: 'Michael McCaul' } },
        NOT: { id: { in: latestTrades.map(t => t.id) } },
      },
      orderBy: { tradedAt: 'desc' },
      take: 5 - latestTrades.length,
      include: { politician: true, issuer: true },
    });
    latestTrades = [...latestTrades, ...filled];
  }

  // Top 5 most active politicians (by trade count) with latest trade date
  const topPoliticiansGrouped = await prisma.trade.groupBy({
    by: ['politicianId'],
    _count: { politicianId: true },
    _max: { tradedAt: true },
    orderBy: { _count: { politicianId: 'desc' } },
    take: 5
  });

  const topPoliticianIds = topPoliticiansGrouped.map(g => g.politicianId);
  const topPoliticians = await prisma.politician.findMany({ where: { id: { in: topPoliticianIds } } });
  const polById = new Map(topPoliticians.map(p => [p.id, p] as const));
  // Calculate detailed stats for each politician
  const featuredListWithStats = await Promise.all(
    topPoliticiansGrouped.map(async (g) => {
      const politician = polById.get(g.politicianId);
      if (!politician) return null;

      // Get issuer count and total volume for this politician
      const [issuerStats, volumeStats] = await Promise.all([
        prisma.trade.groupBy({
          by: ['issuerId'],
          where: { politicianId: g.politicianId },
          _count: { issuerId: true }
        }),
        prisma.trade.aggregate({
          where: { politicianId: g.politicianId },
          _sum: { sizeMax: true }
        })
      ]);

      return {
        politician,
        stats: {
          tradeCount: g._count.politicianId,
          latestTradeDate: g._max.tradedAt,
          issuerCount: issuerStats.length,
          totalVolume: Number(volumeStats._sum.sizeMax || 0)
        }
      };
    })
  );

  const featuredList = featuredListWithStats.filter(item => item !== null) as { politician: typeof topPoliticians[number]; stats: { tradeCount: number; latestTradeDate: Date | null; issuerCount: number; totalVolume: number } }[];
  const [tradeCount, polCount, issuerCount, lastTradeDate] = await Promise.all([
    prisma.trade.count(),
    prisma.politician.count(),
    prisma.issuer.count(),
    prisma.trade.findFirst({
      orderBy: { tradedAt: 'desc' },
      select: { tradedAt: true }
    }).then(result => result?.tradedAt || new Date())
  ]);

  // Note: per-card stats for politicians are provided by featuredList above
  return (
    <div className="min-h-screen bg-gray-900">
      <main className="space-y-10">
      {/* hero */}
      <section className="rounded-xl overflow-hidden hero-gradient">
        <div className="px-8 py-16 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-white">
            <span className="zh-Hant">國會交易追蹤</span>
            <span className="zh-Hans hidden">国会交易追踪</span>
          </h1>
          <p className="text-white/90 mb-6">
            <span className="zh-Hant">追蹤國會議員的股票交易，為您的投資研究提供寶貴洞察</span>
            <span className="zh-Hans hidden">追踪国会议员的股票交易，为您的投资研究提供宝贵洞察</span>
          </p>
          <Link href="/register" className="inline-block bg-white text-purple-600 border border-white font-semibold px-5 py-2 rounded shadow hover:bg-purple-100 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none transition-colors duration-200" aria-label="Subscribe for free">
            <span className="zh-Hant">免費訂閱 →</span>
            <span className="zh-Hans hidden">免费订阅 →</span>
          </Link>
        </div>
      </section>

      {/* stats */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            <span className="zh-Hant">數據概覽</span>
            <span className="zh-Hans hidden">数据概览</span>
          </h2>
          <div className="flex items-center gap-3">
            <DataFreshnessIndicator timestamp={lastTradeDate} />
            <LastUpdated timestamp={lastTradeDate} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <LoadingWrapper fallback={<StatsCardSkeleton />}>
          <div className="border border-gray-600 bg-gray-800 p-2 sm:p-4 rounded shadow-md">
            <div className="text-xs sm:text-sm text-white">
              <span className="zh-Hant">總交易</span>
              <span className="zh-Hans hidden">总交易</span>
            </div>
            <div className="text-lg sm:text-2xl font-semibold text-white">{tradeCount}</div>
          </div>
        </LoadingWrapper>
        <LoadingWrapper fallback={<StatsCardSkeleton />}>
          <div className="border border-gray-600 bg-gray-800 p-2 sm:p-4 rounded shadow-md">
            <div className="text-xs sm:text-sm text-white">
              <span className="zh-Hant">政治家</span>
              <span className="zh-Hans hidden">政治家</span>
            </div>
            <div className="text-lg sm:text-2xl font-semibold text-white">{polCount}</div>
          </div>
        </LoadingWrapper>
        <LoadingWrapper fallback={<StatsCardSkeleton />}>
          <div className="border border-gray-600 bg-gray-800 p-2 sm:p-4 rounded shadow-md">
            <div className="text-xs sm:text-sm text-white">
              <span className="zh-Hant">發行商</span>
              <span className="zh-Hans hidden">发行商</span>
            </div>
            <div className="text-lg sm:text-2xl font-semibold text-white">{issuerCount}</div>
          </div>
        </LoadingWrapper>
        </div>
      </section>
      {/* Latest Trades and Popular Politicians Cards */}
      <section className="space-y-8">
        {/* Latest Trades (5 cards) */}
        <div className="bg-gray-800 border border-gray-600 rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">
              <span className="zh-Hant">最新交易</span>
              <span className="zh-Hans hidden">最新交易</span>
            </h2>
            <Link href="/trades" className="text-blue-400 text-sm hover:text-blue-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none rounded">
              <span className="zh-Hant">查看所有</span>
              <span className="zh-Hans hidden">查看所有</span>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {latestTrades.map(t => (
              <div key={t.id} className="bg-gray-700 rounded-lg p-4 hover:shadow-lg transition-shadow duration-300">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-300">{new Date(t.tradedAt).toLocaleDateString('zh-TW')}</span>
                  <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full">{t.type.toUpperCase()}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden">
                    <HomePoliticianImage politicianId={t.politician.id} politicianName={t.politician.name} />
                  </div>
                  <div className="flex-1">
                    <Link href={`/politicians/${t.politician.id}`} className="text-white font-semibold hover:text-blue-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none rounded">{t.politician.name}</Link>
                    <div className="text-xs text-gray-300">{t.politician.party} • {t.politician.state}</div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-600">
                  <div>
                    <div className="text-xs text-gray-400">
                      <span className="zh-Hant">發行商</span>
                      <span className="zh-Hans hidden">发行商</span>
                    </div>
                    <Link href={`/issuers/${t.issuer.id}`} className="text-white font-medium hover:text-blue-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none rounded">{t.issuer.name}</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Politicians (5 cards) */}
        <div className="bg-gray-800 border border-gray-600 rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">
              <span className="zh-Hant">熱門議員</span>
              <span className="zh-Hans hidden">热门议员</span>
            </h2>
            <Link href="/politicians" className="text-blue-400 text-sm hover:text-blue-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none rounded">
              <span className="zh-Hant">查看所有</span>
              <span className="zh-Hans hidden">查看所有</span>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredList.map(({ politician, stats }) => (
              <PoliticianCard
                key={politician.id}
                politician={{
                  id: politician.id,
                  name: politician.name,
                  party: politician.party,
                  chamber: politician.chamber,
                  trades: stats.tradeCount,
                  issuers: stats.issuerCount,
                  volume: stats.totalVolume,
                  lastTraded: stats.latestTradeDate
                }}
                showWatchlistButton={false}
                initialInWatchlist={false}
              />
            ))}
          </div>
        </div>
      </section>
      </main>
    </div>
  );
}
