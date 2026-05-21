import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUserWithTier, isPaid } from '@/lib/membership';
import { badgeStyles } from '@/components/badgeStyles';
import { navLinkButtonStyles } from '@/components/linkStyles';
import { pageTitleStyles } from '@/components/typographyStyles';
import { statSurfaceStyles } from '@/components/surfaceStyles';
import { getIssuerDetailData } from '@/lib/repos/issuersRepo';
import PoliticianProfileImage from '@/components/PoliticianProfileImage';
import IssuerMarketTrendChart from '@/components/IssuerMarketTrendChart';
import { sectorToZh } from '@/lib/sectorI18n';

export const dynamic = 'force-dynamic';

interface IssuerDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function IssuerDetailPage({ 
  params, 
}: IssuerDetailPageProps) {
  const { id } = await params;
  const me = await getCurrentUserWithTier();
  if (!isPaid(me)) {
    redirect('/upgrade?reason=paid_required');
  }
  const detail = await getIssuerDetailData(id);
  if (!detail) notFound();
  const { issuer, stats, recentTrades, chartPoints } = detail;

  return (
    <div className="min-h-screen bg-gray-900">
      <main className="p-4">
        <div className="mb-6">
          <h1 className={pageTitleStyles()}>
            <span className="zh-Hant">發行商</span>
            <span className="zh-Hans hidden">发行商</span>
          <span className="ko hidden">발행사</span>
          </h1>
        </div>

        <section className="rounded-xl border border-gray-700 bg-gray-800 p-5 mb-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold text-white">{issuer.name}</h2>
            <div className="text-gray-300">{issuer.ticker || 'N/A'}</div>
            <div className="flex flex-wrap gap-2">
              {issuer.sector && <span className={badgeStyles('info')}>{sectorToZh(issuer.sector) || issuer.sector}</span>}
              {issuer.country && <span className={badgeStyles('neutral')}>{issuer.country}</span>}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className={statSurfaceStyles()}>
            <div className="text-xs text-white/70">交易次數</div>
            <div className="text-xl text-white font-semibold">{stats.trades.toLocaleString('en-US')}</div>
          </div>
          <div className={statSurfaceStyles()}>
            <div className="text-xs text-white/70">交易議員</div>
            <div className="text-xl text-white font-semibold">{stats.politicians.toLocaleString('en-US')}</div>
          </div>
          <div className={statSurfaceStyles()}>
            <div className="text-xs text-white/70">交易總額</div>
            <div className="text-xl text-white font-semibold">${Math.round(stats.totalVolume).toLocaleString('en-US')}</div>
          </div>
          <div className={statSurfaceStyles()}>
            <div className="text-xs text-white/70">最大交易</div>
            <div className="text-xl text-white font-semibold">${Math.round(stats.maxTrade).toLocaleString('en-US')}</div>
          </div>
          <div className={statSurfaceStyles()}>
            <div className="text-xs text-white/70">最後交易</div>
            <div className="text-xl text-white font-semibold">{stats.lastTraded ? stats.lastTraded.toLocaleDateString('zh-TW') : '-'}</div>
          </div>
        </section>

        <section className="mb-6">
          <IssuerMarketTrendChart issuerName={issuer.name} points={chartPoints} />
        </section>

        <section className="rounded-xl border border-gray-700 bg-gray-800 p-5 mb-6">
          <h3 className="text-xl font-semibold text-white mb-4">最近交易</h3>
          {recentTrades.length === 0 ? (
            <div className="text-gray-400">目前沒有最近交易資料。</div>
          ) : (
            <div className="space-y-3">
              {recentTrades.map((trade) => (
                <div key={trade.id} className="rounded-lg border border-gray-700 bg-gray-900 p-3">
                  {(() => {
                    const tradeType = (trade.type || '').toUpperCase();
                    const badgeTone = tradeType === 'BUY' ? 'success' : tradeType === 'SELL' ? 'danger' : 'neutral';
                    return (
                      <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-700 shrink-0">
                        <PoliticianProfileImage politicianId={trade.politician.id} politicianName={trade.politician.name} />
                      </div>
                      <Link href={`/politicians/${trade.politician.id}`} className="text-blue-300 hover:text-blue-200">
                        {trade.politician.name}
                      </Link>
                    </div>
                    <span className={badgeStyles(badgeTone, 'xs')}>
                      {trade.type || 'N/A'}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-gray-300 flex flex-wrap gap-4">
                    <span>交易日：{trade.tradedAt.toLocaleDateString('zh-TW')}</span>
                    <span>金額：{trade.sizeMin && trade.sizeMax ? `$${Math.round(trade.sizeMin).toLocaleString('en-US')} - $${Math.round(trade.sizeMax).toLocaleString('en-US')}` : '-'}</span>
                    <span>價格：{trade.price !== null ? `$${trade.price.toFixed(2)}` : '-'}</span>
                  </div>
                      </>
                    );
                  })()}
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="mt-6">
          <Link 
            href="/issuers" 
            className={navLinkButtonStyles()}
          >
            ← 返回發行商列表
          </Link>
        </div>
      </main>
    </div>
  );
}
