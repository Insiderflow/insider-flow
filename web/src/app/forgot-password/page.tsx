"use client";
import ForgotPasswordForm from '@/components/ForgotPasswordForm';
import { panelSurfaceStyles } from '@/components/surfaceStyles';
import { bodySubtextStyles, pageTitleStyles } from '@/components/typographyStyles';

export const dynamic = 'force-dynamic';

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <main className="p-8 max-w-md mx-auto space-y-6">
        <div className="text-center">
          <h1 className={`${pageTitleStyles()} mb-2`}>忘記密碼</h1>
          <p className={bodySubtextStyles()}>輸入您的電子郵件以接收重設連結</p>
        </div>
        <div className={panelSurfaceStyles()}>
          <ForgotPasswordForm />
        </div>
      </main>
    </div>
  );
}


