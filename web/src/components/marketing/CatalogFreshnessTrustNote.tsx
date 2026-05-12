/**
 * Replaces alarming “數據較舊” style badges with trust-forward copy:
 * sync cadence + what “最後更新” actually measures.
 */
export default function CatalogFreshnessTrustNote({ asOf }: { asOf: Date }) {
  const iso = asOf.getTime() > 0 ? asOf.toISOString().slice(0, 10) : null;
  return (
    <div className="w-full max-w-lg ml-auto space-y-3 rounded-xl border border-emerald-500/25 bg-emerald-950/25 px-4 py-3 text-left shadow-inner shadow-black/20">
      <p className="text-sm font-semibold leading-snug text-emerald-300/95 zh-Hant">
        最新披露已更新（每 24 小時自動同步官方文件）
      </p>
      <p className="text-sm font-semibold leading-snug text-emerald-300/95 zh-Hans hidden">
        最新披露已更新（每 24 小时自动同步官方文件）
      </p>
      <p lang="en" className="text-[11px] leading-snug text-emerald-200/70">
        Catalog refreshed daily from official STOCK disclosures (typically within 24h). Latest filing/trade date below — not “broken sync.”
      </p>
      <div className="border-t border-white/10 pt-3 space-y-1.5">
        <p className="text-[11px] sm:text-xs text-gray-400 leading-snug zh-Hant">
          「最後更新」＝資料庫內<strong className="text-gray-300 font-medium">最新一筆官方披露／交易日</strong>
          {iso ? `（${iso}）` : ''}
          ；國會法定披露晚於成交數日屬正常，不代表未同步。
        </p>
        <p className="text-[11px] sm:text-xs text-gray-400 leading-snug zh-Hans hidden">
          「最后更新」＝数据库内<strong className="text-gray-300 font-medium">最新一笔官方披露／交易日</strong>
          {iso ? `（${iso}）` : ''}
          ；国会法定披露晚于成交数日属正常，不代表未同步。
        </p>
        <p lang="en" className="text-[10px] sm:text-[11px] text-gray-600 leading-snug">
          “Last updated” = latest Capitol STOCK disclosure or trade date in our dataset (calendar lag vs Wall Street is expected).
        </p>
      </div>
    </div>
  );
}
