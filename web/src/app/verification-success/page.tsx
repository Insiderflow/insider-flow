export default function VerificationSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">驗證成功！</h1>
            <p className="text-gray-600">您的電子郵件已成功驗證</p>
          </div>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              您現在可以登入並使用 Insider Flow 的所有功能。
            </p>
            
            <div className="flex flex-col space-y-3">
              <a 
                href="/login" 
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                立即登入
              </a>
              <a 
                href="/" 
                className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
              >
                返回首頁
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
