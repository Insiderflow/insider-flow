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
        <p className={`${bodySubtextStyles()} mb-4`}>請使用「註冊的電郵」與「密碼」登入。</p>
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


















