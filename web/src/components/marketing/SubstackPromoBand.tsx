import Link from 'next/link';
import { getSubstackPublishUrl } from '@/lib/siteConfig';
import { panelSurfaceStyles } from '@/components/surfaceStyles';

export default function SubstackPromoBand() {
  const url = getSubstackPublishUrl();

  return (
    <section
      className={`${panelSurfaceStyles('lg')} rounded-xl border border-orange-500/30 bg-gradient-to-br from-gray-900 via-gray-900 to-orange-950/40 overflow-hidden`}
      aria-labelledby="substack-promo-heading"
    >
      <div className="p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center gap-6">
        <div className="flex-1 space-y-3">
          <p className="text-orange-400 text-xs font-semibold uppercase tracking-wide">
            <span className="zh-Hant">最強免費價值</span>
            <span className="zh-Hans hidden">最强免费价值</span>
          </p>
          <h2 id="substack-promo-heading" className="text-2xl sm:text-3xl font-bold text-white leading-tight zh-Hant">
            每週深度：美國國會資金流與選股思路
          </h2>
          <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight zh-Hans hidden">
            每周深度：美国国会资金流与选股思路
          </h2>
          <p className="text-gray-300 text-sm sm:text-base leading-relaxed zh-Hant">
            網站給你即時表與名單；<strong className="text-white">Substack 週報</strong>
            用長文幫你串趨勢、解讀披露、整理可跟進標的——完全免費訂閱，建議與付費功能搭配使用。
          </p>
          <p className="text-gray-300 text-sm sm:text-base leading-relaxed zh-Hans hidden">
            网站给你即时表与名单；<strong className="text-white">Substack 周报</strong>
            用长文帮你串趋势、解读披露、整理可跟进标的——完全免费订阅，建议与付费功能搭配使用。
          </p>
          <p lang="en" className="text-xs text-gray-500 leading-relaxed">
            Weekly deep dives (ZH): context on Capitol flows, filings, and themes—free on Substack. Best paired with the live tables here.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
          <Link
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-lg bg-orange-500 px-6 py-3.5 text-base font-bold text-gray-900 hover:bg-orange-400 transition-colors shadow-lg shadow-orange-900/40 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            <span className="zh-Hant">免費訂閱 Substack 週報 →</span>
            <span className="zh-Hans hidden">免费订阅 Substack 周报 →</span>
          </Link>
          <Link
            href="/upgrade"
            className="inline-flex items-center justify-center rounded-lg border border-gray-600 bg-gray-800/80 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-700 transition-colors"
          >
            <span className="zh-Hant">同時解鎖付費數據</span>
            <span className="zh-Hans hidden">同时解锁付费数据</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
