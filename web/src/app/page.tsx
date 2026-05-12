import Link from 'next/link';
import HomePoliticianImage from '@/components/HomePoliticianImage';
import LastUpdated from '@/components/LastUpdated';
import CatalogFreshnessTrustNote from '@/components/marketing/CatalogFreshnessTrustNote';
import SubstackPromoBand from '@/components/marketing/SubstackPromoBand';
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
      {/* hero */}
      <section className="rounded-2xl overflow-hidden hero-gradient border border-white/10 shadow-xl shadow-black/40">
        <div className="relative z-10 px-5 sm:px-10 py-14 sm:py-20 text-center">
          <div className="max-w-2xl lg:max-w-3xl mx-auto flex flex-col items-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-[11px] sm:text-xs font-medium tracking-[0.12em] text-white/85 uppercase mb-6 backdrop-blur-sm">
              <span className="zh-Hant">美國國會 STOCK 披露 · 華語介面</span>
              <span className="zh-Hans hidden">美国国会 STOCK 披露 · 华语界面</span>
            </p>

            <h1 className="text-balance text-3xl sm:text-4xl md:text-[2.65rem] font-extrabold text-white leading-[1.15] tracking-tight mb-5 drop-shadow-sm zh-Hant">
              內幕流 — 把國會資金流變成你的選股雷達
            </h1>
            <h1 className="text-balance text-3xl sm:text-4xl md:text-[2.65rem] font-extrabold text-white leading-[1.15] tracking-tight mb-5 drop-shadow-sm zh-Hans hidden">
              内幕流 — 把国会资金流变成你的选股雷达
            </h1>

            <div className="text-white/85 text-[15px] sm:text-base leading-relaxed max-w-xl mb-2 space-y-3 text-left w-full">
              <p className="zh-Hant">
                <span className="text-emerald-300/95 font-semibold">免費：</span>
                首頁預覽最新交易、無限瀏覽 <Link href="/trades" className="text-white underline decoration-white/30 underline-offset-2 hover:decoration-white">完整 /trades 表</Link>
                ；訂閱 <strong className="text-white">Substack 週報</strong> 拿長文觀點。
              </p>
              <p className="zh-Hans hidden">
                <span className="text-emerald-300/95 font-semibold">免费：</span>
                首页预览最新交易、无限浏览 <Link href="/trades" className="text-white underline decoration-white/30 underline-offset-2 hover:decoration-white">完整 /trades 表</Link>
                ；订阅 <strong className="text-white">Substack 周报</strong> 拿长文观点。
              </p>
              <p className="zh-Hant">
                <span className="text-blue-300/95 font-semibold">付費 Insider+：</span>
                議員／發行商<strong className="text-white">深度頁</strong>、圖表、企業內部人專區與 Watchlist 進階能力。
              </p>
              <p className="zh-Hans hidden">
                <span className="text-blue-300/95 font-semibold">付费 Insider+：</span>
                议员／发行商<strong className="text-white">深度页</strong>、图表、企业内部人专区与 Watchlist 进阶能力。
              </p>
            </div>

            <p
              lang="en"
              className="text-white/50 text-[13px] sm:text-sm leading-relaxed max-w-lg mt-4 pt-4 border-t border-white/10 w-full text-left"
            >
              <strong className="text-white/70">Free:</strong> live preview + full disclosure table + Substack weekly research.
              {' '}
              <strong className="text-white/70">Paid:</strong> politician & issuer analytics, charts, alerts where enabled.
            </p>

            <div className="mt-10 w-full flex flex-col items-stretch sm:items-center gap-4">
              <Link
                href="/upgrade"
                className="inline-flex w-full sm:w-auto sm:min-w-[280px] justify-center rounded-xl bg-blue-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-950/50 ring-1 ring-white/10 transition hover:bg-blue-500 hover:shadow-blue-900/40 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 focus:ring-offset-[#0f081c]"
              >
                <span className="zh-Hant">立即升級 Insider+</span>
                <span className="zh-Hans hidden">立即升级 Insider+</span>
              </Link>
              <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-center gap-3 sm:gap-4 text-sm w-full sm:w-auto">
                <Link
                  href={substackUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-xl border-2 border-orange-400/80 bg-orange-500 px-6 py-3 font-bold text-gray-900 shadow-md shadow-orange-950/40 transition hover:bg-orange-400 hover:border-orange-300"
                >
                  <span className="zh-Hant">免費訂閱 Substack 週報</span>
                  <span className="zh-Hans hidden">免费订阅 Substack 周报</span>
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center rounded-xl border border-white/25 bg-white/10 px-6 py-3 font-semibold text-white backdrop-blur-sm transition hover:bg-white/15 hover:border-white/40"
                >
                  <span className="zh-Hant">建立 Watchlist（免費）</span>
                  <span className="zh-Hans hidden">建立 Watchlist（免费）</span>
                </Link>
              </div>
            </div>
          </div>
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
