/**
 * Clarifies that "last updated" reflects latest official disclosure/trade date in the DB,
 * not wall-clock sync — reduces perceived "stale data" churn for CRO.
 */
export default function CatalogFreshnessTrustNote({ asOf }: { asOf: Date }) {
  const iso = asOf.getTime() > 0 ? asOf.toISOString().slice(0, 10) : null;
  return (
    <div className="text-right max-w-md ml-auto space-y-1">
      <p className="text-[11px] sm:text-xs text-gray-500 leading-snug zh-Hant">
        「最後更新」為資料庫內<strong className="text-gray-400 font-medium">最新一筆官方披露／交易日</strong>
        {iso ? `（${iso}）` : ''}，國會法定披露本來就會晚於成交數日，不代表系統未同步。
      </p>
      <p className="text-[11px] sm:text-xs text-gray-500 leading-snug zh-Hans hidden">
        「最后更新」为数据库内<strong className="text-gray-400 font-medium">最新官方披露／交易日</strong>
        {iso ? `（${iso}）` : ''}，国会法定披露本来就会晚于成交数日，不代表系统未同步。
      </p>
      <p lang="en" className="text-[10px] sm:text-[11px] text-gray-600 leading-snug">
        Timestamp = latest Capitol STOCK disclosure or trade date in our catalog, not “last cron run.”
        Congressional reporting legally lags execution—this is normal.
      </p>
    </div>
  );
}
