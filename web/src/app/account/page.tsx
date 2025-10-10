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
        
        {/* Membership Status */}
        <div className="mb-6 bg-gray-800 border border-gray-600 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            <span className="zh-Hant">會員狀態</span>
            <span className="zh-Hans hidden">会员状态</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <span className="text-gray-400">
                <span className="zh-Hant">會員等級:</span>
                <span className="zh-Hans hidden">会员等级:</span>
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                user.membership_tier === 'PAID' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-600 text-gray-300'
              }`}>
                <span className="zh-Hant">{user.membership_tier === 'PAID' ? '付費會員' : '免費會員'}</span>
                <span className="zh-Hans hidden">{user.membership_tier === 'PAID' ? '付费会员' : '免费会员'}</span>
              </span>
            </div>
            
            {user.membership_tier === 'PAID' && user.membership_expires_at && (
              <div className="flex items-center gap-3">
                <span className="text-gray-400">
                  <span className="zh-Hant">下次續費:</span>
                  <span className="zh-Hans hidden">下次续费:</span>
                </span>
                <span className="text-white font-medium">
                  {new Date(user.membership_expires_at).toLocaleDateString('zh-TW', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            )}
            
            {user.membership_tier === 'FREE' && (
              <div className="flex items-center gap-3">
                <span className="text-gray-400">
                  <span className="zh-Hant">升級會員:</span>
                  <span className="zh-Hans hidden">升级会员:</span>
                </span>
                <a 
                  href="/upgrade" 
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200 text-sm"
                >
                  <span className="zh-Hant">立即升級</span>
                  <span className="zh-Hans hidden">立即升级</span>
                </a>
              </div>
            )}
          </div>
        </div>

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
                  user.email_verified 
                    ? 'bg-green-600 text-white' 
                    : 'bg-red-600 text-white'
                }`}>
                  <span className="zh-Hant">{user.email_verified ? '已驗證' : '未驗證'}</span>
                  <span className="zh-Hans hidden">{user.email_verified ? '已验证' : '未验证'}</span>
                </span>
              </div>
              <div>
                <span className="text-gray-400">
                  <span className="zh-Hant">註冊時間:</span>
                  <span className="zh-Hans hidden">注册时间:</span>
                </span>
                <span className="text-white ml-2">
                  {new Date(user.created_at).toLocaleDateString('zh-TW')}
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

        {/* Subscription Management for Paid Users */}
        {user.membership_tier === 'PAID' && (
          <div className="mt-6 bg-gray-800 border border-gray-600 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              <span className="zh-Hant">訂閱管理</span>
              <span className="zh-Hans hidden">订阅管理</span>
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">
                    <span className="zh-Hant">管理訂閱</span>
                    <span className="zh-Hans hidden">管理订阅</span>
                  </h3>
                  <p className="text-gray-400 text-sm">
                    <span className="zh-Hant">取消或修改您的訂閱設定</span>
                    <span className="zh-Hans hidden">取消或修改您的订阅设置</span>
                  </p>
                </div>
                <form action="/api/stripe/portal" method="post">
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none transition-colors duration-200"
                  >
                    <span className="zh-Hant">管理訂閱</span>
                    <span className="zh-Hans hidden">管理订阅</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

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
                  disabled={user.email_verified}
                >
                  {user.email_verified ? '已驗證' : '重新發送'}
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


