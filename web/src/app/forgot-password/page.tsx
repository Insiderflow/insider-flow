"use client";
import ForgotPasswordForm from '@/components/ForgotPasswordForm';

export const dynamic = 'force-dynamic';

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <main className="p-8 max-w-md mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">忘記密碼</h1>
          <p className="text-gray-300">輸入您的電子郵件以接收重設連結</p>
        </div>
        <div className="border border-gray-600 bg-gray-800 rounded-lg p-6 shadow-md">
          <ForgotPasswordForm />
        </div>
      </main>
    </div>
  );
}


