import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function RegisterSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="max-w-md mx-auto border border-gray-600 bg-gray-800 rounded-lg p-6 shadow-md text-center">
        <h1 className="text-2xl font-bold text-white mb-3">感謝你的註冊</h1>
        <p className="text-gray-300 mb-4">請使用「註冊的電郵」與「密碼」登入。</p>
        <Link
          href="/login"
          className="inline-block bg-white text-gray-900 px-4 py-2 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          前往登入
        </Link>
      </div>
    </div>
  );
}


















