import ResetPasswordForm from '@/components/ResetPasswordForm';
import { panelSurfaceStyles } from '@/components/surfaceStyles';
import { bodySubtextStyles, pageTitleStyles } from '@/components/typographyStyles';

export const dynamic = 'force-dynamic';

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const token = typeof sp.token === 'string' ? sp.token : '';
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <main className="p-8 max-w-md mx-auto space-y-6">
        <div className="text-center">
          <h1 className={`${pageTitleStyles()} mb-2`}>重設密碼</h1>
          <p className={bodySubtextStyles()}>請輸入新密碼</p>
        </div>
        <div className={panelSurfaceStyles()}>
          <ResetPasswordForm token={token} />
        </div>
      </main>
    </div>
  );
}


