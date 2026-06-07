const REFUND_EMAIL = 'hiukiny@gmail.com';

export default function ShutdownNotice({ variant = 'banner' }: { variant?: 'banner' | 'card' }) {
  const isBanner = variant === 'banner';

  return (
    <div
      role="alert"
      className={
        isBanner
          ? 'border-b border-amber-600/60 bg-amber-950 text-amber-50'
          : 'rounded-xl border-2 border-amber-500/70 bg-amber-950/95 text-amber-50 shadow-lg shadow-amber-950/40'
      }
    >
      <div className={`max-w-6xl mx-auto px-4 ${isBanner ? 'py-4' : 'p-5 sm:p-6'}`}>
        <p className="text-xs font-bold uppercase tracking-wider text-amber-300 mb-1.5">
          <span className="zh-Hant">重要公告</span>
          <span className="zh-Hans hidden">重要公告</span>
          <span className="ko hidden">중요 공지</span>
          <span lang="en" className="ml-2 text-amber-400/90">Important Notice</span>
        </p>
        <h2 className={`font-bold text-white ${isBanner ? 'text-base sm:text-lg' : 'text-lg sm:text-xl'} mb-2`}>
          <span className="zh-Hant">本服務將於 2026 年 7 月停止營運</span>
          <span className="zh-Hans hidden">本服务将于 2026 年 7 月停止营运</span>
          <span className="ko hidden">본 서비스는 2026년 7월에 종료됩니다</span>
        </h2>
        <p className={`leading-relaxed text-amber-100/95 ${isBanner ? 'text-sm' : 'text-sm sm:text-base'}`}>
          <span className="zh-Hant">
            內幕流即將結束營運。若您持有<strong className="text-white">年繳訂閱</strong>，請聯絡{' '}
            <a href={`mailto:${REFUND_EMAIL}`} className="font-semibold text-white underline underline-offset-2 hover:text-amber-200">
              {REFUND_EMAIL}
            </a>{' '}
            申請退款。
          </span>
          <span className="zh-Hans hidden">
            内幕流即将结束营运。若您持有<strong className="text-white">年缴订阅</strong>，请联络{' '}
            <a href={`mailto:${REFUND_EMAIL}`} className="font-semibold text-white underline underline-offset-2 hover:text-amber-200">
              {REFUND_EMAIL}
            </a>{' '}
            申请退款。
          </span>
          <span className="ko hidden">
            Insider Flow 서비스가 종료됩니다. <strong className="text-white">연간 구독</strong> 회원은{' '}
            <a href={`mailto:${REFUND_EMAIL}`} className="font-semibold text-white underline underline-offset-2 hover:text-amber-200">
              {REFUND_EMAIL}
            </a>
            로 환불 문의해 주세요.
          </span>
        </p>
        <p lang="en" className={`mt-2 text-amber-200/80 ${isBanner ? 'text-xs sm:text-sm' : 'text-sm'}`}>
          We are winding down this business by July 2026. If you have an{' '}
          <strong className="text-white">annual subscription</strong>, please contact{' '}
          <a href={`mailto:${REFUND_EMAIL}`} className="font-semibold text-white underline underline-offset-2 hover:text-amber-200">
            {REFUND_EMAIL}
          </a>{' '}
          for a refund.
        </p>
      </div>
    </div>
  );
}
