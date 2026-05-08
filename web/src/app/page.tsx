import Link from 'next/link';
import HomePoliticianImage from '@/components/HomePoliticianImage';
import LastUpdated, { DataFreshnessIndicator } from '@/components/LastUpdated';
import { actionStyles } from '@/components/actionStyles';
import { badgeStyles } from '@/components/badgeStyles';
import { textLinkStyles } from '@/components/linkStyles';
import { panelSurfaceStyles } from '@/components/surfaceStyles';
import { bodySubtextStyles, mutedLabelStyles, sectionTitleStyles } from '@/components/typographyStyles';
import { getHomePageStats } from '@/lib/repos/homeRepo';
import { getPoliticiansPageData } from '@/lib/repos/politiciansRepo';
import { getLatestTradesPublic } from '@/lib/repos/tradesRepo';
import { getCurrentUserWithTier, isPaid } from '@/lib/membership';
import StatCard from '@/components/StatCard';
export const dynamic = 'force-dynamic';

export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const me = await getCurrentUserWithTier();
  const canAccessDetails = isPaid(me);
  const verified = sp.verified === 'true';
  const verificationError = sp.verification;
  const [stats, latestTrades, topPoliticiansResult] = await Promise.all([
    getHomePageStats(),
    getLatestTradesPublic(10),
    getPoliticiansPageData({ page: 1, pageSize: 6, sortBy: 'trades', order: 'desc' }),
  ]);
  const lastTradeDate = stats.lastTradeDate;

  return (
    <div className="min-h-screen bg-gray-900">
      <main className="p-4 space-y-8">
      {/* hero */}
      <section className="rounded-xl overflow-hidden hero-gradient border border-gray-700">
        <div className="px-5 sm:px-8 py-14 sm:py-20 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-white">
            <span className="zh-Hant">內幕流 內幕交易即時追蹤</span>
            <span className="zh-Hans hidden">内幕流 内幕交易即时追踪</span>
          </h1>
          <p className="text-white/90 mb-8 text-lg">
            <span className="zh-Hant">追蹤國會議員最新交易、發行商動向與市場熱點。</span>
            <span className="zh-Hans hidden">追踪国会议员最新交易、发行商动向与市场热点。</span>
          </p>
          <Link href="/register" className={actionStyles('secondary')} aria-label="Register watchlist">
            <span className="zh-Hant">立即註冊 Watchlist</span>
            <span className="zh-Hans hidden">立即注册 Watchlist</span>
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
          <h2 className={sectionTitleStyles()}>
            <span className="zh-Hant">數據概覽</span>
            <span className="zh-Hans hidden">数据概览</span>
          </h2>
          <div className="flex items-center gap-3">
            <DataFreshnessIndicator timestamp={lastTradeDate} />
            <LastUpdated timestamp={lastTradeDate} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label={<><span className="zh-Hant">總交易</span><span className="zh-Hans hidden">总交易</span></>} value={stats.tradeCount.toLocaleString('en-US')} />
          <StatCard label={<><span className="zh-Hant">政治家</span><span className="zh-Hans hidden">政治家</span></>} value={stats.politicianCount.toLocaleString('en-US')} />
          <StatCard label={<><span className="zh-Hant">發行商</span><span className="zh-Hans hidden">发行商</span></>} value={stats.issuerCount.toLocaleString('en-US')} />
        </div>
      </section>
      {/* Latest Trades and Most Traded Politicians */}
      <section className="space-y-8">
        {/* Latest Trades */}
        <div className={`${panelSurfaceStyles()} rounded-xl shadow-md`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className={`${sectionTitleStyles()} text-2xl mb-1`}>
                <span className="zh-Hant">🔥 最新交易</span>
                <span className="zh-Hans hidden">🔥 最新交易</span>
              </h2>
              <p className={`text-sm ${mutedLabelStyles()}`}>
                <span className="zh-Hant">公開前 10 筆最新交易</span>
                <span className="zh-Hans hidden">国会议员最新股票交易动态</span>
              </p>
            </div>
            <Link href="/trades" className={actionStyles('ghost')}>
              <span className="zh-Hant">查看所有 →</span>
              <span className="zh-Hans hidden">查看所有 →</span>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {latestTrades.map(t => (
              <div key={t.id} className="bg-gray-700 rounded-lg p-4 hover:shadow-lg transition-all duration-300 hover:bg-gray-600">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex flex-col">
                    <span className={`text-sm ${bodySubtextStyles()}`}>
                      <span className="zh-Hant">交易日期: {new Date(t.tradedAt).toLocaleDateString('zh-TW')}</span>
                      <span className="zh-Hans hidden">交易日期: {new Date(t.tradedAt).toLocaleDateString('zh-CN')}</span>
                    </span>
                    {t.publishedAt && (
                      <span className={`text-xs ${mutedLabelStyles()}`}>
                        <span className="zh-Hant">發布日期: {new Date(t.publishedAt).toLocaleDateString('zh-TW')}</span>
                        <span className="zh-Hans hidden">发布日期: {new Date(t.publishedAt).toLocaleDateString('zh-CN')}</span>
                      </span>
                    )}
                  </div>
                  <span className={badgeStyles(
                    t.type.toLowerCase() === 'buy'
                      ? 'success'
                      : t.type.toLowerCase() === 'sell'
                        ? 'danger'
                        : 'info',
                    'sm'
                  )}>
                    {t.type.toUpperCase()}
                  </span>
                </div>
                
                <div className="flex items-center space-x-3 mb-3">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden">
                    <HomePoliticianImage politicianId={t.politician.id} politicianName={t.politician.name} />
                  </div>
                  <div className="flex-1">
                    <Link href={`/politicians/${t.politician.id}`} className="text-white font-semibold hover:text-blue-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none rounded">{t.politician.name}</Link>
                    <div className={`text-xs ${bodySubtextStyles()}`}>{t.politician.party} • {t.politician.state}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${mutedLabelStyles()}`}>
                      <span className="zh-Hant">發行商</span>
                      <span className="zh-Hans hidden">发行商</span>
                    </span>
                    <Link href={`/issuers/${t.issuer.id}`} className={`${textLinkStyles()} text-sm`}>{t.issuer.name}</Link>
                  </div>
                  
                  {t.sizeMin && t.sizeMax && (
                    <div className="flex items-center justify-between">
                      <span className={`text-xs ${mutedLabelStyles()}`}>
                        <span className="zh-Hant">交易規模</span>
                        <span className="zh-Hans hidden">交易规模</span>
                      </span>
                      <span className="text-sm text-white">
                        ${Number(t.sizeMin).toLocaleString()} - ${Number(t.sizeMax).toLocaleString()}
                      </span>
                    </div>
                  )}
                  
                  {t.price !== null && (
                    <div className="flex items-center justify-between">
                      <span className={`text-xs ${mutedLabelStyles()}`}>
                        <span className="zh-Hant">價格</span>
                        <span className="zh-Hans hidden">价格</span>
                      </span>
                      <span className="text-sm text-white">${t.price.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Most Traded Politicians */}
        <div className={`${panelSurfaceStyles()} rounded-xl shadow-md`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={sectionTitleStyles()}>
              <span className="zh-Hant">最常交易議員</span>
              <span className="zh-Hans hidden">最常交易议员</span>
            </h2>
            <Link href="/politicians" className={`${textLinkStyles('muted')} text-sm`}>
              <span className="zh-Hant">查看所有</span>
              <span className="zh-Hans hidden">查看所有</span>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topPoliticiansResult.rows.map((row) => {
              const detailHref = canAccessDetails ? `/politicians/${row.id}` : '/upgrade?reason=paid_required';
              return (
              <div key={row.id} className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden">
                    <HomePoliticianImage politicianId={row.id} politicianName={row.name} />
                  </div>
                  <div className="min-w-0">
                    <Link href={detailHref} className="text-white font-semibold hover:text-blue-300 truncate block">
                      {row.name}
                    </Link>
                    <p className={`text-xs ${mutedLabelStyles()}`}>{row.party || 'Unknown'} · {row.chamber || 'N/A'}</p>
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-gray-400">交易次數</span><span className="text-white">{row.trades}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">發行商數</span><span className="text-white">{row.issuers}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">總金額</span><span className="text-white">${Math.round(row.totalVolume).toLocaleString('en-US')}</span></div>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      </section>
      </main>
    </div>
  );
}
