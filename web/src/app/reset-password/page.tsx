import ResetPasswordForm from '@/components/ResetPasswordForm';

export const dynamic = 'force-dynamic';

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const token = typeof sp.token === 'string' ? sp.token : '';
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <main className="p-8 max-w-md mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">重設密碼</h1>
          <p className="text-gray-300">請輸入新密碼</p>
        </div>
        <div className="border border-gray-600 bg-gray-800 rounded-lg p-6 shadow-md">
          <ResetPasswordForm token={token} />
        </div>
      </main>
    </div>
  );
}


