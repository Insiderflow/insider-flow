import { panelSurfaceStyles } from '@/components/surfaceStyles';
import { sectionTitleStyles } from '@/components/typographyStyles';

type Row = { zhHant: [string, string, string]; zhHans: [string, string, string]; en: string };

const rows: Row[] = [
  {
    zhHant: ['首頁最新交易精選', '前 20 筆預覽', '＋深度頁、圖表、企業內部人'],
    zhHans: ['首页最新交易精选', '前 20 笔预览', '＋深度页、图表、企业内部人'],
    en: 'Home teaser: 20 cards; paid adds deep pages, charts, corporate insider hub.',
  },
  {
    zhHant: ['/trades 完整表 + 篩選', '✅ 免費', '✅ 付費'],
    zhHans: ['/trades 完整表 + 筛选', '✅ 免费', '✅ 付费'],
    en: 'Full trades table & filters: free and paid.',
  },
  {
    zhHant: ['議員／發行商 詳情頁（圖表、持倉）', '需升級', '✅ 解鎖'],
    zhHans: ['议员／发行商 详情页（图表、持仓）', '需升级', '✅ 解锁'],
    en: 'Politician / issuer detail analytics: paid.',
  },
  {
    zhHant: ['企業內部人（OpenInsider）專區', '需升級', '✅ 解鎖'],
    zhHans: ['企业内部人（OpenInsider）专区', '需升级', '✅ 解锁'],
    en: 'Corporate insider screener: paid.',
  },
  {
    zhHant: ['Watchlist + 電郵通知', '✅（驗證信箱後）', '✅ 同上；另解鎖深度頁'],
    zhHans: ['Watchlist + 邮件通知', '✅（验证邮箱后）', '✅ 同上；另解锁深度页'],
    en: 'Watchlist alerts after email verify; paid adds deep-dive pages.',
  },
  {
    zhHant: ['Substack 每週深度週報', '✅ 免費訂閱', '✅ 免費訂閱'],
    zhHans: ['Substack 每周深度周报', '✅ 免费订阅', '✅ 免费订阅'],
    en: 'Weekly Substack research: always free.',
  },
];

export default function FreeVsPaidComparison() {
  return (
    <section className={`${panelSurfaceStyles('lg')} rounded-xl border border-gray-700 overflow-hidden mb-10`}>
      <h2 className={`${sectionTitleStyles()} text-center px-4 pt-8 pb-2 text-xl sm:text-2xl`}>
        <span className="zh-Hant">免費 vs 付費 · 一眼看懂差異</span>
        <span className="zh-Hans hidden">免费 vs 付费 · 一眼看懂差异</span>
      </h2>
      <p className="text-center text-sm text-gray-500 px-4 pb-6 max-w-2xl mx-auto lang-en">
        Free vs Paid at a glance — Traditional Chinese primary; English gloss per row.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm border-collapse">
          <thead>
            <tr className="bg-gray-800/90 text-left text-gray-300">
              <th className="p-3 sm:p-4 font-semibold border-b border-gray-700 w-[36%]">
                <span className="zh-Hant">功能</span>
                <span className="zh-Hans hidden">功能</span>
              </th>
              <th className="p-3 sm:p-4 font-semibold border-b border-gray-700 w-[32%] text-emerald-400/95">
                <span className="zh-Hant">免費</span>
                <span className="zh-Hans hidden">免费</span>
              </th>
              <th className="p-3 sm:p-4 font-semibold border-b border-gray-700 w-[32%] text-blue-400">
                <span className="zh-Hant">付費 Insider+</span>
                <span className="zh-Hans hidden">付费 Insider+</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-gray-800/80 hover:bg-gray-800/40">
                <td className="p-3 sm:p-4 align-top text-gray-200">
                  <span className="zh-Hant block">{row.zhHant[0]}</span>
                  <span className="zh-Hans hidden block">{row.zhHans[0]}</span>
                  <span lang="en" className="block text-[10px] text-gray-600 mt-1 leading-snug">
                    {row.en}
                  </span>
                </td>
                <td className="p-3 sm:p-4 align-top text-gray-300">
                  <span className="zh-Hant">{row.zhHant[1]}</span>
                  <span className="zh-Hans hidden">{row.zhHans[1]}</span>
                </td>
                <td className="p-3 sm:p-4 align-top text-gray-100 font-medium">
                  <span className="zh-Hant">{row.zhHant[2]}</span>
                  <span className="zh-Hans hidden">{row.zhHans[2]}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
