import Link from 'next/link';
import HomePoliticianImage from '@/components/HomePoliticianImage';
import LastUpdated from '@/components/LastUpdated';
import CatalogFreshnessTrustNote from '@/components/marketing/CatalogFreshnessTrustNote';
import SubstackPromoBand from '@/components/marketing/SubstackPromoBand';
import TestimonialsSection from '@/components/marketing/TestimonialsSection';
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
import { getSubstackPublishUrl, HOME_LATEST_TRADES_PREVIEW } from '@/lib/siteConfig';
export const dynamic = 'force-dynamic';

export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const me = await getCurrentUserWithTier();
  const canAccessDetails = isPaid(me);
  const verified = sp.verified === 'true';
  const verificationError = sp.verification;
  const [stats, latestTrades, topPoliticiansResult] = await Promise.all([
    getHomePageStats(),
    getLatestTradesPublic(HOME_LATEST_TRADES_PREVIEW),
    getPoliticiansPageData({ page: 1, pageSize: 6, sortBy: 'trades', order: 'desc' }),
  ]);
  const lastTradeDate = stats.lastTradeDate;
  const substackUrl = getSubstackPublishUrl();

  return (
    <div className="min-h-screen bg-gray-900">
      <main className="p-4 space-y-8">
      {/* hero — 繁中為主、註冊為首要 CTA */}
      <section className="rounded-2xl overflow-hidden hero-gradient border border-white/10 shadow-xl shadow-black/40">
        <div className="relative z-10 px-5 sm:px-10 py-14 sm:py-20 text-center">
          <div className="max-w-2xl lg:max-w-3xl mx-auto flex flex-col items-center">
            <h1 className="zh-Hant text-balance text-5xl sm:text-6xl md:text-7xl font-black text-white tracking-tight mb-2 drop-shadow-sm">
              內幕流
            </h1>
            <h1 className="zh-Hans hidden text-balance text-5xl sm:text-6xl md:text-7xl font-black text-white tracking-tight mb-2 drop-shadow-sm">
              内幕流
            </h1>

            <p className="zh-Hant mb-4 max-w-md text-center text-xs font-medium leading-relaxed tracking-wide text-white/50 sm:text-sm">
              「已有 1,247 位台灣投資人加入每週內幕報告」
            </p>
            <p className="zh-Hans mb-4 hidden max-w-md text-center text-xs font-medium leading-relaxed tracking-wide text-white/50 sm:text-sm">
              「已有 1,247 位台湾投资人加入每周内幕报告」
            </p>

            <p className="text-balance text-lg sm:text-xl md:text-2xl font-semibold text-white/95 mb-8 max-w-xl leading-snug">
              <span className="zh-Hant">美國國會議員內線交易即時追蹤</span>
              <span className="zh-Hans hidden">美国国会议员内线交易即时追踪</span>
            </p>

            <Link
              href="/register"
              className="inline-flex w-full sm:w-auto min-h-[3.5rem] items-center justify-center rounded-2xl bg-emerald-500 px-10 py-4 text-lg sm:text-xl font-bold text-gray-950 shadow-xl shadow-emerald-950/50 ring-2 ring-emerald-300/40 transition hover:bg-emerald-400 hover:ring-emerald-200/60 focus:outline-none focus:ring-4 focus:ring-emerald-300/50 focus:ring-offset-2 focus:ring-offset-[#0f081c]"
            >
              <span className="zh-Hant">免費註冊 Watchlist</span>
              <span className="zh-Hans hidden">免费注册 Watchlist</span>
            </Link>

            <p className="mt-4 text-sm sm:text-base text-white/70 max-w-md leading-relaxed">
              <span className="zh-Hant">
                已幫助 1,500+ 人發現交易機會
                <span className="mx-2 text-white/40">·</span>
                35,000+ 筆交易即時更新
              </span>
              <span className="zh-Hans hidden">
                已帮助 1,500+ 人发现交易机会
                <span className="mx-2 text-white/40">·</span>
                35,000+ 笔交易即时更新
              </span>
            </p>

            <div className="mt-10 w-full max-w-xl text-left space-y-3 text-[15px] sm:text-base text-white/85 border-t border-white/10 pt-8">
              <p className="zh-Hant">
                <span className="text-emerald-300/95 font-semibold">免費：</span>
                瀏覽 <Link href="/trades" className="text-white underline decoration-white/35 underline-offset-2 hover:decoration-white">最新交易表</Link>
                ，註冊後即可建立 Watchlist 與信箱通知。
              </p>
              <p className="zh-Hans hidden">
                <span className="text-emerald-300/95 font-semibold">免费：</span>
                浏览 <Link href="/trades" className="text-white underline decoration-white/35 underline-offset-2 hover:decoration-white">最新交易表</Link>
                ，注册后即可建立 Watchlist 与邮件通知。
              </p>
              <p className="zh-Hant">
                <span className="text-amber-200/95 font-semibold">付費 Insider+：</span>
                解鎖議員／公司<strong className="text-white">深度頁</strong>、圖表與進階研究工具。
              </p>
              <p className="zh-Hans hidden">
                <span className="text-amber-200/95 font-semibold">付费 Insider+：</span>
                解锁议员／公司<strong className="text-white">深度页</strong>、图表与进阶研究工具。
              </p>
            </div>

            {/* A/B: Variant A — Substack primary (current) · Variant B — swap Link order & promote /upgrade to primary styles */}
            <div className="mt-8 flex w-full max-w-xl flex-col items-stretch justify-center gap-4 md:max-w-none md:w-auto md:flex-row md:flex-wrap md:items-center md:gap-3">
              <Link
                href={substackUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[3.5rem] w-full items-center justify-center rounded-2xl bg-orange-500 px-10 py-5 text-lg font-extrabold text-gray-950 shadow-xl shadow-orange-600/45 ring-2 ring-orange-300/70 transition hover:bg-orange-400 hover:shadow-orange-500/50 focus:outline-none focus:ring-4 focus:ring-orange-300/45 focus:ring-offset-2 focus:ring-offset-[#0f081c] md:min-h-0 md:w-auto md:rounded-xl md:px-9 md:py-4 md:text-base md:shadow-xl md:ring-2 md:ring-orange-300/55"
              >
                <span className="zh-Hant">免費訂閱 Substack 週報</span>
                <span className="zh-Hans hidden">免费订阅 Substack 周报</span>
              </Link>
              <Link
                href="/upgrade"
                className="inline-flex min-h-[3.25rem] w-full items-center justify-center rounded-2xl border-2 border-blue-400/90 bg-blue-950/50 px-10 py-5 text-lg font-semibold text-white shadow-lg shadow-blue-500/35 ring-1 ring-blue-400/30 backdrop-blur-sm transition hover:border-blue-300 hover:bg-blue-900/60 hover:shadow-blue-400/25 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-900 md:min-h-0 md:w-auto md:rounded-xl md:border-2 md:px-6 md:py-2.5 md:text-sm md:shadow-md md:shadow-blue-500/40"
              >
                <span className="zh-Hant">升級 Insider+</span>
                <span className="zh-Hans hidden">升级 Insider+</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <TestimonialsSection />

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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <h2 className={sectionTitleStyles()}>
            <span className="zh-Hant">數據概覽</span>
            <span className="zh-Hans hidden">数据概览</span>
          </h2>
          <div className="flex flex-col items-stretch sm:items-end gap-3 shrink-0 w-full sm:w-auto">
            <div className="flex flex-wrap items-center justify-end gap-2 text-xs text-gray-400">
              <LastUpdated timestamp={lastTradeDate} />
            </div>
            <CatalogFreshnessTrustNote asOf={lastTradeDate} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                <span className="zh-Hant">
                  公開預覽：最新 {HOME_LATEST_TRADES_PREVIEW} 筆卡片（完整表免費見「交易」）
                </span>
                <span className="zh-Hans hidden">
                  公开预览：最新 {HOME_LATEST_TRADES_PREVIEW} 笔卡片（完整表免费见「交易」）
                </span>
              </p>
            </div>
            <Link href="/trades" className={actionStyles('ghost')}>
              <span className="zh-Hant">免費看完整表 →</span>
              <span className="zh-Hans hidden">免费看完整表 →</span>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {latestTrades.map((t) => {
              const polHref = canAccessDetails ? `/politicians/${t.politician.id}` : '/upgrade?reason=paid_required';
              const issuerHref = canAccessDetails ? `/issuers/${t.issuer.id}` : '/upgrade?reason=paid_required';
              return (
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
                    <Link href={polHref} className="text-white font-semibold hover:text-blue-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none rounded">{t.politician.name}</Link>
                    <div className={`text-xs ${bodySubtextStyles()}`}>{t.politician.party} • {t.politician.state}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${mutedLabelStyles()}`}>
                      <span className="zh-Hant">發行商</span>
                      <span className="zh-Hans hidden">发行商</span>
                    </span>
                    <Link href={issuerHref} className={`${textLinkStyles()} text-sm`}>{t.issuer.name}</Link>
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
                {!canAccessDetails ? (
                  <p className="mt-3 pt-2 border-t border-gray-600/80 text-[11px] text-amber-400/95 leading-snug text-center">
                    <span className="zh-Hant">點名稱解鎖深度頁</span>
                    <span className="zh-Hans hidden">点击名称解锁深度页</span>
                  </p>
                ) : null}
              </div>
              );
            })}
          </div>
        </div>

        <SubstackPromoBand />

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
