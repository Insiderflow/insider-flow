export const dynamic = 'force-dynamic';

export default function VerifySentPage() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="max-w-md mx-auto border border-gray-600 bg-gray-800 rounded-lg p-6 shadow-md text-center">
        <h1 className="text-2xl font-bold text-white mb-2">驗證信已寄出</h1>
        <p className="text-gray-300">我們已將驗證連結寄至您的電子郵件。請於 1 小時內完成驗證。</p>
        <p className="text-gray-400 text-sm mt-2">請檢查您的垃圾郵件資料夾。</p>
      </div>
    </div>
  );
}


