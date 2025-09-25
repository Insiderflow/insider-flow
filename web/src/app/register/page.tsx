import Link from 'next/link';
import RegistrationForm from '@/components/RegistrationForm';

export const dynamic = 'force-dynamic';

export default async function RegisterPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const next = typeof sp.next === 'string' ? sp.next : '/';
  
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <main className="p-8 max-w-md mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">歡迎加入</h1>
          <p className="text-gray-300">註冊以獲取國會交易數據的完整訪問權限</p>
        </div>
        
        <div className="border border-gray-600 bg-gray-800 rounded-lg p-6 shadow-md">
          <RegistrationForm next={next} />
        </div>
        
        <div className="text-center">
          <p className="text-sm text-gray-400">
            已有帳戶？ <Link className="text-blue-300 hover:text-blue-100 underline focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none rounded transition-colors duration-200" href={next}>跳過註冊</Link>
          </p>
        </div>
      </main>
    </div>
  );
}


