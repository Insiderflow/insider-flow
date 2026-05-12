import FreeVsPaidComparison from './FreeVsPaidComparison';
import UpgradePricingClient from './UpgradePricingClient';
import { bodySubtextStyles, pageTitleStyles } from '@/components/typographyStyles';
import { panelSurfaceStyles } from '@/components/surfaceStyles';

export default function UpgradePage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className={`${pageTitleStyles()} mb-4`}>
            <span className="zh-Hant">升級 Insider+ · 把國會倉位變成你的研究護城河</span>
            <span className="zh-Hans hidden">升级 Insider+ · 把国会仓位变成你的研究护城河</span>
          </h1>
          <p className={`${bodySubtextStyles()} text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed`}>
            <span className="zh-Hant">
              免費版已能瀏覽<strong className="text-white">完整交易表</strong>與名單；付費解鎖
              <strong className="text-white">議員／發行商深度頁、圖表與企業內部人專區</strong>
              ——適合認真跟美股的華語投資人。
            </span>
            <span className="zh-Hans hidden">
              免费版已能浏览<strong className="text-white">完整交易表</strong>与名单；付费解锁
              <strong className="text-white">议员／发行商深度页、图表与企业内部人专区</strong>
              ——适合认真跟美股的华语投资人。
            </span>
          </p>
          <p lang="en" className="mt-4 text-sm text-gray-500 max-w-2xl mx-auto">
            Free tier already includes the full /trades table. Paid unlocks politician & issuer analytics, charts, and the corporate insider hub—built for serious US-equity research.
          </p>
        </div>

        <section className={`${panelSurfaceStyles()} max-w-3xl mx-auto mb-10 rounded-xl border border-gray-700 p-6 text-center`}>
          <p className="text-gray-400 text-sm zh-Hant">
            我們正在收集可公開展示的用戶回饋。若願意分享使用心得，歡迎在 Substack 回信或寫信至客服信箱——優質心得有機會登上此區並獲得額外會員天數（由團隊審核）。
          </p>
          <p className="text-gray-400 text-sm zh-Hans hidden">
            我们正在收集可公开展示的用户反馈。若愿意分享使用心得，欢迎在 Substack 回信或写信至客服信箱——优质心得有机会登上此区并获得额外会员天数（由团队审核）。
          </p>
          <p lang="en" className="text-xs text-gray-600 mt-3">
            Social proof wall: invite only — reply on Substack or email support with a short story; selected quotes may appear here with your permission.
          </p>
        </section>

        <FreeVsPaidComparison />
        <UpgradePricingClient />
      </div>
    </div>
  );
}
