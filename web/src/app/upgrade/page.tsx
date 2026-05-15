import FreeVsPaidComparison from './FreeVsPaidComparison';
import UpgradePricingClient from './UpgradePricingClient';
import TestimonialsSection from '@/components/marketing/TestimonialsSection';
import { bodySubtextStyles, pageTitleStyles } from '@/components/typographyStyles';

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

        <div className="mb-10">
          <TestimonialsSection />
        </div>

        <FreeVsPaidComparison />
        <UpgradePricingClient />
      </div>
    </div>
  );
}
