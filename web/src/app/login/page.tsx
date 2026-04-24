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
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <main className="p-8 max-w-md mx-auto space-y-6">
        <div className="text-center">
          <h1 className={`${pageTitleStyles()} mb-2`}>登入</h1>
          <p className={bodySubtextStyles()}>請輸入您的帳戶資訊</p>
        </div>
        <div className={panelSurfaceStyles()}>
          <LoginForm next={next} />
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-400">
            尚未註冊？ <Link className={textLinkStyles()} href={`/register?next=${encodeURIComponent(next)}`}>建立帳戶</Link>
          </p>
        </div>
      </main>
    </div>
  );
}


