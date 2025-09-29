 

import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import LoadingWrapper from '@/components/LoadingWrapper';
import HomePoliticianImage from '@/components/HomePoliticianImage';
import { StatsCardSkeleton } from '@/components/SkeletonLoader';
import LastUpdated, { DataFreshnessIndicator } from '@/components/LastUpdated';
import PoliticianCard from '@/components/PoliticianCard';
export const dynamic = 'force-dynamic';

export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const verified = sp.verified === 'true';
  const verificationError = sp.verification;
  // Get the latest 5 trades (excluding Michael McCaul and future dates)
  const now = new Date();
  const latestTrades = await prisma.trade.findMany({
    where: {
      Politician: { name: { not: 'Michael McCaul' } },
      traded_at: { 
        lte: now, // Only trades up to today
        gte: new Date('2020-01-01') // Only trades from 2020 onwards
      },
    },
    orderBy: { traded_at: 'desc' },
    take: 5,
    include: { Politician: true, Issuer: true },
  });

  // Top 5 most active politicians (by trade count) with latest trade date
  const topPoliticiansGrouped = await prisma.trade.groupBy({
    by: ['politician_id'],
    _count: { politician_id: true },
    _max: { traded_at: true },
    orderBy: { _count: { politician_id: 'desc' } },
    take: 5
  });

  const topPoliticianIds = topPoliticiansGrouped.map(g => g.politician_id);
  const topPoliticians = await prisma.politician.findMany({ where: { id: { in: topPoliticianIds } } });
  const polById = new Map(topPoliticians.map(p => [p.id, p] as const));
  // Calculate detailed stats for each politician
  const featuredListWithStats = await Promise.all(
    topPoliticiansGrouped.map(async (g) => {
      const politician = polById.get(g.politician_id);
      if (!politician) return null;

      // Get issuer count and total volume for this politician
      const [issuerStats, volumeStats] = await Promise.all([
        prisma.trade.groupBy({
          by: ['issuer_id'],
          where: { politician_id: g.politician_id },
          _count: { issuer_id: true }
        }),
        prisma.trade.aggregate({
          where: { politician_id: g.politician_id },
          _sum: { size_max: true }
        })
      ]);

      return {
        politician,
        stats: {
          tradeCount: g._count.politician_id,
          latestTradeDate: g._max.traded_at,
          issuerCount: issuerStats.length,
          totalVolume: Number(volumeStats._sum.size_max || 0)
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
      orderBy: { traded_at: 'desc' },
      select: { traded_at: true }
    }).then(result => result?.traded_at || new Date())
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

      {/* Verification Messages */}
      {verified && (
        <div className="bg-green-600 text-white p-4 rounded-lg mx-4">
          <div className="text-center">
            <h3 className="font-semibold mb-1">
              <span className="zh-Hant">✅ 電子郵件驗證成功！</span>
              <span className="zh-Hans hidden">✅ 电子邮件验证成功！</span>
            </h3>
            <p className="text-sm">
              <span className="zh-Hant">您的帳戶已成功驗證，現在可以完整使用所有功能。</span>
              <span className="zh-Hans hidden">您的账户已成功验证，现在可以完整使用所有功能。</span>
            </p>
          </div>
        </div>
      )}
      
      {verificationError && (
        <div className="bg-red-600 text-white p-4 rounded-lg mx-4">
          <div className="text-center">
            <h3 className="font-semibold mb-1">
              <span className="zh-Hant">❌ 驗證失敗</span>
              <span className="zh-Hans hidden">❌ 验证失败</span>
            </h3>
            <p className="text-sm">
              <span className="zh-Hant">
                {verificationError === 'invalid' 
                  ? '驗證連結無效或已過期，請重新註冊。'
                  : '驗證過程中發生錯誤，請重新註冊。'
                }
              </span>
              <span className="zh-Hans hidden">
                {verificationError === 'invalid' 
                  ? '验证链接无效或已过期，请重新注册。'
                  : '验证过程中发生错误，请重新注册。'
                }
              </span>
            </p>
          </div>
        </div>
      )}

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
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">
                <span className="zh-Hant">🔥 最新交易</span>
                <span className="zh-Hans hidden">🔥 最新交易</span>
              </h2>
              <p className="text-sm text-gray-400">
                <span className="zh-Hant">國會議員最新股票交易動態</span>
                <span className="zh-Hans hidden">国会议员最新股票交易动态</span>
              </p>
            </div>
            <Link href="/trades" className="text-blue-400 text-sm hover:text-blue-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none rounded bg-gray-700 px-3 py-2 rounded-lg hover:bg-gray-600 transition-colors">
              <span className="zh-Hant">查看所有 →</span>
              <span className="zh-Hans hidden">查看所有 →</span>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {latestTrades.map(t => (
              <div key={t.id} className="bg-gray-700 rounded-lg p-4 hover:shadow-lg transition-all duration-300 hover:bg-gray-600">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-300">{new Date(t.traded_at).toLocaleDateString('zh-TW')}</span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    t.type.toLowerCase() === 'buy' 
                      ? 'bg-green-600 text-white' 
                      : t.type.toLowerCase() === 'sell' 
                      ? 'bg-red-600 text-white' 
                      : 'bg-blue-600 text-white'
                  }`}>
                    {t.type.toUpperCase()}
                  </span>
                </div>
                
                <div className="flex items-center space-x-3 mb-3">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden">
                    <HomePoliticianImage politicianId={t.Politician.id} politicianName={t.Politician.name} />
                  </div>
                  <div className="flex-1">
                    <Link href={`/politicians/${t.Politician.id}`} className="text-white font-semibold hover:text-blue-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none rounded">{t.Politician.name}</Link>
                    <div className="text-xs text-gray-300">{t.Politician.party} • {t.Politician.state}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      <span className="zh-Hant">發行商</span>
                      <span className="zh-Hans hidden">发行商</span>
                    </span>
                    <Link href={`/issuers/${t.Issuer.id}`} className="text-white font-medium hover:text-blue-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none rounded text-sm">{t.Issuer.name}</Link>
                  </div>
                  
                  {t.size_min && t.size_max && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        <span className="zh-Hant">交易規模</span>
                        <span className="zh-Hans hidden">交易规模</span>
                      </span>
                      <span className="text-sm text-white">
                        ${Number(t.size_min).toLocaleString()} - ${Number(t.size_max).toLocaleString()}
                      </span>
                    </div>
                  )}
                  
                  {t.price && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        <span className="zh-Hant">價格</span>
                        <span className="zh-Hans hidden">价格</span>
                      </span>
                      <span className="text-sm text-white">${Number(t.price).toFixed(2)}</span>
                    </div>
                  )}
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
