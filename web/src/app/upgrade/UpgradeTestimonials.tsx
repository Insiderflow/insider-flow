import { bodySubtextStyles, sectionTitleStyles } from '@/components/typographyStyles';

type Item = { quote: string; author: string };

const items: Item[] = [
  {
    quote:
      '自從訂閱 InsiderFlow 之後，我終於不用自己一個一個去查 SEC 文件了。每週的報告把國會議員、高層和機構的 Cluster Buy 整理得非常清楚，尤其是最近 MOBI、PLSE、FLUT 這些熱門案例，分析又專業又實用。對我這種忙碌的台灣投資人來說，真的省下超多時間，也讓我抓到好幾次不錯的機會。強烈推薦！',
    author: '台灣投資人（匿名）',
  },
  {
    quote:
      '訂閱 InsiderFlow 之後，我每週都能快速看到美國國會議員和機構最新的買賣動作，尤其是 Cluster Buy 的部分整理得非常清楚。以前自己查要花好幾個小時，現在幾分鐘就能掌握重點，對我這種在台灣操作美股的人來說真的超有幫助！',
    author: '台灣美股投資人（匿名）',
  },
  {
    quote:
      '原本以為只是看內幕交易清單，沒想到報告的分析深度遠超出預期。最近 MOBI 和 FLUT 的案例讓我看到高層買入的決心，也讓我及時注意到這些機會。年付雖然一開始覺得貴，但實際價值遠高於價格。',
    author: '香港交易者（匿名）',
  },
];

function StarRow() {
  return (
    <div className="flex items-center gap-0.5 text-amber-400" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} className="h-4 w-4 fill-current" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function UpgradeTestimonials() {
  return (
    <section
      className="mb-10 rounded-2xl border border-blue-900/60 bg-gradient-to-b from-slate-950 via-gray-900 to-gray-900/95 px-4 py-10 sm:px-8 shadow-xl shadow-blue-950/40"
      aria-labelledby="upgrade-testimonials-heading"
    >
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 text-center">
          <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/35 bg-amber-950/40 px-3 py-1 text-xs font-semibold tracking-wide text-amber-200">
              <StarRow />
              <span className="zh-Hant">真實付費用戶</span>
              <span className="zh-Hans hidden">真实付费用户</span>
            </span>
          </div>
          <h2 id="upgrade-testimonials-heading" className={`${sectionTitleStyles()} text-2xl sm:text-3xl`}>
            <span className="zh-Hant">真實用戶怎麼說</span>
            <span className="zh-Hans hidden">真实用户怎么说</span>
          </h2>
          <p className={`${bodySubtextStyles()} mx-auto mt-2 max-w-2xl text-sm text-gray-400`}>
            <span className="zh-Hant">付費用戶真實心得 · 以下為匿名節錄，經用戶同意刊登；內容不代表投資建議。</span>
            <span className="zh-Hans hidden">付费用户真实心得 · 以下为匿名节录，经用户同意刊登；内容不代表投资建议。</span>
          </p>
        </div>

        {/* Mobile: horizontal snap scroll · Desktop: 3-column grid */}
        <div className="flex gap-4 overflow-x-auto pb-2 pt-1 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:snap-none [&::-webkit-scrollbar]:hidden">
          {items.map((item, index) => (
            <article
              key={index}
              className="snap-center shrink-0 w-[min(100%,20rem)] rounded-xl border border-amber-500/30 bg-gray-800/90 p-6 shadow-lg shadow-amber-950/15 backdrop-blur-sm sm:w-[min(100%,22rem)] sm:p-8 md:w-auto md:min-w-0"
            >
              <div className="mb-4 flex items-center justify-between gap-2">
                <StarRow />
                <span className="rounded bg-blue-950/80 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-200/90 ring-1 ring-amber-500/25">
                  Insider+
                </span>
              </div>
              <blockquote className="border-l-2 border-amber-500/50 pl-4">
                <p className="text-sm leading-relaxed text-gray-200 sm:text-[0.9375rem]">
                  <span className="font-serif text-amber-100/90">&ldquo;</span>
                  <span className="italic text-gray-100">{item.quote}</span>
                  <span className="font-serif text-amber-100/90">&rdquo;</span>
                </p>
              </blockquote>
              <footer className="mt-5 border-t border-gray-700/80 pt-4 text-right text-sm font-medium text-amber-200/95">
                — {item.author}
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
