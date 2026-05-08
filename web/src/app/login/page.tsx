import Link from 'next/link';
import LoginForm from '@/components/LoginForm';
import { textLinkStyles } from '@/components/linkStyles';
import { panelSurfaceStyles } from '@/components/surfaceStyles';
import { bodySubtextStyles, pageTitleStyles } from '@/components/typographyStyles';

export const dynamic = 'force-dynamic';

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const next = typeof sp.next === 'string' ? sp.next : '/';
  return (
    <div className="min-h-screen bg-gray-900">
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <section className="rounded-xl overflow-hidden hero-gradient border border-gray-700">
          <div className="px-5 sm:px-8 py-10 sm:py-12 text-center">
            <h1 className="text-3xl md:text-4xl font-extrabold mb-3 text-white">
              <span className="zh-Hant">歡迎回來</span>
              <span className="zh-Hans hidden">欢迎回来</span>
            </h1>
            <p className="text-white/90 text-sm sm:text-base">
              <span className="zh-Hant">登入後即可管理追蹤名單與通知設定。</span>
              <span className="zh-Hans hidden">登录后即可管理追踪名单与通知设置。</span>
            </p>
          </div>
        </section>
        <div className={`${panelSurfaceStyles()} max-w-xl mx-auto`}>
          <div className="mb-4 text-center">
            <h2 className={`${pageTitleStyles()} mb-2 text-2xl`}>登入</h2>
            <p className={bodySubtextStyles()}>請輸入您的帳戶資訊</p>
          </div>
          <LoginForm next={next} />
        </div>
        <div className="text-center max-w-xl mx-auto">
          <p className="text-sm text-gray-400">
            還沒有帳號？ <Link className={textLinkStyles()} href={`/register?next=${encodeURIComponent(next)}`}>立即註冊</Link>
          </p>
        </div>
      </main>
    </div>
  );
}


