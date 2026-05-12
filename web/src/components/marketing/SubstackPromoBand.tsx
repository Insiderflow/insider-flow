import Link from 'next/link';
import { getSubstackPublishUrl } from '@/lib/siteConfig';

export default function SubstackPromoBand() {
  const url = getSubstackPublishUrl();

  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-orange-400/35 shadow-xl shadow-orange-950/30"
      aria-labelledby="substack-promo-heading"
    >
      {/* Orange + blue split emphasis */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-orange-600/25 via-amber-950/40 to-blue-950/50"
        aria-hidden
      />
      <div
        className="absolute -right-16 -top-24 h-56 w-56 rounded-full bg-blue-500/15 blur-3xl"
        aria-hidden
      />
      <div
        className="absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-orange-500/20 blur-2xl"
        aria-hidden
      />

      <div className="relative z-10 p-6 sm:p-10 flex flex-col lg:flex-row lg:items-center gap-8 border border-white/5 rounded-2xl bg-gray-950/40 backdrop-blur-sm">
        <div className="flex-1 space-y-4">
          <p className="inline-flex items-center rounded-md bg-orange-500/90 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-gray-900 shadow-sm">
            <span className="zh-Hant">免費 · 每週深度</span>
            <span className="zh-Hans hidden">免费 · 每周深度</span>
          </p>
          <h2 id="substack-promo-heading" className="text-2xl sm:text-3xl md:text-[2rem] font-extrabold text-white leading-tight drop-shadow-sm zh-Hant">
            Substack 週報：國會資金流長文拆解
          </h2>
          <h2 className="text-2xl sm:text-3xl md:text-[2rem] font-extrabold text-white leading-tight drop-shadow-sm zh-Hans hidden">
            Substack 周报：国会资金流长文拆解
          </h2>
          <p className="text-gray-200 text-sm sm:text-base leading-relaxed max-w-2xl zh-Hant">
            站內表格給你速度；<strong className="text-orange-200">週報</strong>
            給你脈絡與選股思路——完全<strong className="text-white">免費訂閱</strong>
            ，與付費深度頁搭配最有效。
          </p>
          <p className="text-gray-200 text-sm sm:text-base leading-relaxed max-w-2xl zh-Hans hidden">
            站内表格给你速度；<strong className="text-orange-200">周报</strong>
            给你脉络与选股思路——完全<strong className="text-white">免费订阅</strong>
            ，与付费深度页搭配最有效。
          </p>
          <p lang="en" className="text-xs text-blue-200/70 leading-relaxed max-w-xl border-l-2 border-blue-400/50 pl-3">
            Weekly deep dives on Capitol flows & themes — free. Pair with Insider+ for charts and politician analytics.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0 lg:min-w-[220px]">
          <Link
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-xl bg-orange-500 px-7 py-4 text-base font-extrabold text-gray-900 hover:bg-orange-400 transition shadow-lg shadow-orange-950/50 ring-2 ring-orange-300/30 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:ring-offset-2 focus:ring-offset-gray-950"
          >
            <span className="zh-Hant">免費訂閱週報 →</span>
            <span className="zh-Hans hidden">免费订阅周报 →</span>
          </Link>
          <Link
            href="/upgrade"
            className="inline-flex items-center justify-center rounded-xl border-2 border-blue-400/70 bg-blue-600/90 px-7 py-3.5 text-sm font-bold text-white hover:bg-blue-500 transition shadow-md shadow-blue-950/40"
          >
            <span className="zh-Hant">升級完整分析</span>
            <span className="zh-Hans hidden">升级完整分析</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
