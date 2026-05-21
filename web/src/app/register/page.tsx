import RegistrationForm from '@/components/RegistrationForm';
import { panelSurfaceStyles } from '@/components/surfaceStyles';
import { bodySubtextStyles, pageTitleStyles } from '@/components/typographyStyles';

export const dynamic = 'force-dynamic';

export default async function RegisterPage() {
  
  return (
    <div className="min-h-screen bg-gray-900">
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <section className="rounded-xl overflow-hidden hero-gradient border border-gray-700">
          <div className="px-5 sm:px-8 py-10 sm:py-12 text-center">
            <h1 className="text-3xl md:text-4xl font-extrabold mb-3 text-white">
              <span className="zh-Hant">建立 Insider Flow 帳號</span>
              <span className="zh-Hans hidden">建立 Insider Flow 账号</span>
          <span className="ko hidden">Insider Flow 계정 만들기</span>
            </h1>
            <p className="text-white/90 text-sm sm:text-base">
              <span className="zh-Hant">立即註冊，啟用議員追蹤與交易通知。</span>
              <span className="zh-Hans hidden">立即注册，启用议员追踪与交易通知。</span>
          <span className="ko hidden">지금 가입하고 의원 추적 및 거래 알림을 활성화하세요.</span>
            </p>
          </div>
        </section>
        <div className={`${panelSurfaceStyles()} max-w-xl mx-auto`}>
          <div className="mb-4 text-center">
            <h2 className={`${pageTitleStyles()} mb-2 text-2xl`}>註冊</h2>
            <p className={bodySubtextStyles()}>使用電郵註冊並建立密碼</p>
          </div>
          <RegistrationForm />
        </div>
      </main>
    </div>
  );
}


