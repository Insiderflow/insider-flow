import { getSessionUser } from '@/lib/auth';
import EmailNotificationSettings from '@/components/EmailNotificationSettings';
import PasswordChangeForm from '@/components/PasswordChangeForm';

export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-gray-300">請先登入</div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-900">
      <main className="p-4 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">
          <span className="zh-Hant">帳戶設定</span>
          <span className="zh-Hans hidden">账户设置</span>
        </h1>
        
        {/* Account Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Info */}
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              <span className="zh-Hant">基本資訊</span>
              <span className="zh-Hans hidden">基本信息</span>
            </h2>
            <div className="space-y-3">
              <div>
                <span className="text-gray-400">
                  <span className="zh-Hant">電子郵件:</span>
                  <span className="zh-Hans hidden">电子邮件:</span>
                </span>
                <span className="text-white ml-2">{user.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">
                  <span className="zh-Hant">郵件驗證:</span>
                  <span className="zh-Hans hidden">邮件验证:</span>
                </span>
                <span className={`px-2 py-1 rounded text-sm ${
                  user.emailVerified 
                    ? 'bg-green-600 text-white' 
                    : 'bg-red-600 text-white'
                }`}>
                  <span className="zh-Hant">{user.emailVerified ? '已驗證' : '未驗證'}</span>
                  <span className="zh-Hans hidden">{user.emailVerified ? '已验证' : '未验证'}</span>
                </span>
              </div>
              <div>
                <span className="text-gray-400">
                  <span className="zh-Hant">註冊時間:</span>
                  <span className="zh-Hans hidden">注册时间:</span>
                </span>
                <span className="text-white ml-2">
                  {new Date(user.createdAt).toLocaleDateString('zh-TW')}
                </span>
              </div>
            </div>
          </div>

          {/* Email Notifications */}
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              <span className="zh-Hant">郵件通知設定</span>
              <span className="zh-Hans hidden">邮件通知设置</span>
            </h2>
            <EmailNotificationSettings />
          </div>
        </div>

        {/* Password Change */}
        <div className="mt-6 bg-gray-800 border border-gray-600 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">更改密碼</h2>
          <PasswordChangeForm />
        </div>

        {/* Account Actions */}
        <div className="mt-6 bg-gray-800 border border-gray-600 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">帳戶操作</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-medium">重新發送驗證郵件</h3>
                <p className="text-gray-400 text-sm">如果您的郵件未驗證，可以重新發送驗證連結</p>
              </div>
              <form action="/api/auth/resend-verification" method="post">
                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none transition-colors duration-200"
                  disabled={user.emailVerified}
                >
                  {user.emailVerified ? '已驗證' : '重新發送'}
                </button>
              </form>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-medium">登出所有裝置</h3>
                <p className="text-gray-400 text-sm">登出所有已登入的裝置，需要重新登入</p>
              </div>
              <form action="/api/auth/logout-all" method="post">
                <button 
                  type="submit"
                  className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:outline-none transition-colors duration-200"
                >
                  登出所有裝置
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


