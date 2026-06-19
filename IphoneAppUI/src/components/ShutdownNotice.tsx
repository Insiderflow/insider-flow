const REFUND_EMAIL = 'hiukiny@gmail.com';

export default function ShutdownNotice() {
  return (
    <div
      role="alert"
      className="rounded-card border-2 border-amber-500/60 bg-amber-950/90 px-4 py-3 text-amber-50"
    >
      <p className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
        重要公告 · Important Notice
      </p>
      <p className="mt-1 text-sm font-bold text-white">
        本服務將於 2026 年 7 月停止營運
      </p>
      <p className="mt-1.5 text-xs leading-relaxed text-amber-100/95">
        年繳訂閱用戶請聯絡{' '}
        <a href={`mailto:${REFUND_EMAIL}`} className="font-semibold text-white underline">
          {REFUND_EMAIL}
        </a>{' '}
        申請退款。
      </p>
      <p lang="en" className="mt-1.5 text-[11px] leading-relaxed text-amber-200/80">
        Winding down by July 2026. Annual subscribers: contact{' '}
        <a href={`mailto:${REFUND_EMAIL}`} className="font-semibold text-white underline">
          {REFUND_EMAIL}
        </a>{' '}
        for a refund.
      </p>
    </div>
  );
}
