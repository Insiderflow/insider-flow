import Link from 'next/link';
import { actionStyles } from '@/components/actionStyles';
import { panelSurfaceStyles } from '@/components/surfaceStyles';
import { bodySubtextStyles, sectionTitleStyles } from '@/components/typographyStyles';

export const dynamic = 'force-dynamic';

export default function RegisterSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className={`max-w-md mx-auto ${panelSurfaceStyles()} text-center`}>
        <h1 className={`${sectionTitleStyles()} mb-3`}>感謝你的註冊</h1>
        <p className={`${bodySubtextStyles()} mb-4`}>
          我們已發送驗證信到你的信箱。請先完成 email 驗證，再使用帳號密碼登入。
        </p>
        <Link
          href="/login"
          className={actionStyles('secondary')}
        >
          前往登入
        </Link>
      </div>
    </div>
  );
}


















