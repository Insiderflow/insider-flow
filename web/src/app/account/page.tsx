import { getSessionUser } from '@/lib/auth';
import EmailNotificationSettings from '@/components/EmailNotificationSettings';
import PasswordChangeForm from '@/components/PasswordChangeForm';
import ManageSubscriptionButton from '@/components/ManageSubscriptionButton';
import AlertsSyncPanel from '@/components/AlertsSyncPanel';
import { actionStyles } from '@/components/actionStyles';
import Link from 'next/link';
import { panelSurfaceStyles } from '@/components/surfaceStyles';
import { bodySubtextStyles, mutedLabelStyles, pageTitleStyles, sectionTitleStyles } from '@/components/typographyStyles';
import { badgeStyles } from '@/components/badgeStyles';

export const dynamic = 'force-dynamic';

export default async function AccountPage({ 
  searchParams 
}: { 
  searchParams: Promise<Record<string, string | string[] | undefined>> 
}) {
  const user = await getSessionUser();
  const params = await searchParams;
  const error = typeof params.error === 'string' ? params.error : null;
  const status = typeof params.status === 'string' ? params.status : null;
  
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
        <h1 className={`${pageTitleStyles()} mb-6`}>
          <span className="zh-Hant">帳戶設定</span>
          <span className="zh-Hans hidden">账户设置</span>
        </h1>
        
        {/* Error Messages */}
        {error && (
          <div className="mb-6 bg-red-900 border border-red-600 rounded-lg p-4">
            <p className="text-red-200">
              {error === 'no_subscription' && (
                <span className="zh-Hant">您目前沒有有效的訂閱。請先升級會員。</span>
              )}
              {error === 'payment_config' && (
                <span className="zh-Hant">支付系統配置錯誤，請聯繫客服。</span>
              )}
              {error === 'portal_failed' && (
                <span className="zh-Hant">無法開啟訂閱管理頁面，請聯繫客服或稍後再試。</span>
              )}
              {error === 'user_not_found' && (
                <span className="zh-Hant">找不到用戶資料，請重新登入。</span>
              )}
              {error === 'invalid_customer' && (
                <span className="zh-Hant">Stripe 客戶資料無效，請聯繫客服。</span>
              )}
              {!['no_subscription', 'payment_config', 'portal_failed', 'user_not_found', 'invalid_customer'].includes(error) && (
                <span className="zh-Hant">發生錯誤：{error}</span>
              )}
            </p>
          </div>
        )}
        
        {/* Success Messages */}
        {status === 'success' && (
          <div className="mb-6 bg-green-900 border border-green-600 rounded-lg p-4">
            <p className="text-green-200">
              <span className="zh-Hant">訂閱成功！歡迎成為付費會員。</span>
              <span className="zh-Hans hidden">订阅成功！欢迎成为付费会员。</span>
            </p>
          </div>
        )}
        
        {/* Membership Status */}
        <div className={`mb-6 ${panelSurfaceStyles()}`}>
          <h2 className={`${sectionTitleStyles()} mb-4`}>
            <span className="zh-Hant">會員狀態</span>
            <span className="zh-Hans hidden">会员状态</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <span className={mutedLabelStyles()}>
                <span className="zh-Hant">會員等級:</span>
                <span className="zh-Hans hidden">会员等级:</span>
              </span>
              <span className={badgeStyles(user.membership_tier === 'PAID' ? 'success' : 'neutral')}>
                <span className="zh-Hant">{user.membership_tier === 'PAID' ? '付費會員' : '免費會員'}</span>
                <span className="zh-Hans hidden">{user.membership_tier === 'PAID' ? '付费会员' : '免费会员'}</span>
              </span>
            </div>
            
            {user.membership_tier === 'PAID' && user.membership_expires_at && (
              <div className="flex items-center gap-3">
                <span className={mutedLabelStyles()}>
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
                <span className={mutedLabelStyles()}>
                  <span className="zh-Hant">升級會員:</span>
                  <span className="zh-Hans hidden">升级会员:</span>
                </span>
                <Link 
                  href="/upgrade" 
                  className={actionStyles('primary')}
                >
                  <span className="zh-Hant">立即升級</span>
                  <span className="zh-Hans hidden">立即升级</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Account Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Info */}
          <div className={panelSurfaceStyles()}>
            <h2 className={`${sectionTitleStyles()} mb-4`}>
              <span className="zh-Hant">基本資訊</span>
              <span className="zh-Hans hidden">基本信息</span>
            </h2>
            <div className="space-y-3">
              <div>
                <span className={mutedLabelStyles()}>
                  <span className="zh-Hant">電子郵件:</span>
                  <span className="zh-Hans hidden">电子邮件:</span>
                </span>
                <span className="text-white ml-2">{user.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={mutedLabelStyles()}>
                  <span className="zh-Hant">郵件驗證:</span>
                  <span className="zh-Hans hidden">邮件验证:</span>
                </span>
                <span className={badgeStyles(user.email_verified ? 'success' : 'danger', 'sm')}>
                  <span className="zh-Hant">{user.email_verified ? '已驗證' : '未驗證'}</span>
                  <span className="zh-Hans hidden">{user.email_verified ? '已验证' : '未验证'}</span>
                </span>
              </div>
              <div>
                <span className={mutedLabelStyles()}>
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
          <div className={panelSurfaceStyles()}>
            <h2 className={`${sectionTitleStyles()} mb-4`}>
              <span className="zh-Hant">郵件通知設定</span>
              <span className="zh-Hans hidden">邮件通知设置</span>
            </h2>
            <EmailNotificationSettings />
          </div>
        </div>

        {/* Password Change */}
        <div className={`mt-6 ${panelSurfaceStyles()}`}>
          <h2 className={`${sectionTitleStyles()} mb-4`}>更改密碼</h2>
          <PasswordChangeForm />
        </div>

        {/* Subscription Management for Paid Users */}
        {user.membership_tier === 'PAID' && (
          <div className={`mt-6 ${panelSurfaceStyles()}`}>
            <h2 className={`${sectionTitleStyles()} mb-4`}>
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
                  <p className={`${bodySubtextStyles()} text-sm`}>
                    <span className="zh-Hant">取消或修改您的訂閱設定</span>
                    <span className="zh-Hans hidden">取消或修改您的订阅设置</span>
                  </p>
                </div>
                <ManageSubscriptionButton />
              </div>
            </div>
          </div>
        )}

        {/* Account Actions */}
        <div className={`mt-6 ${panelSurfaceStyles()}`}>
          <h2 className={`${sectionTitleStyles()} mb-4`}>帳戶操作</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-medium">重新發送驗證郵件</h3>
                <p className={`${bodySubtextStyles()} text-sm`}>如果您的郵件未驗證，可以重新發送驗證連結</p>
              </div>
              <form action="/api/auth/resend-verification" method="post">
                <button 
                  type="submit"
                  className={actionStyles('primary')}
                  disabled={user.email_verified}
                >
                  {user.email_verified ? '已驗證' : '重新發送'}
                </button>
              </form>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-medium">登出所有裝置</h3>
                <p className={`${bodySubtextStyles()} text-sm`}>登出所有已登入的裝置，需要重新登入</p>
              </div>
              <form action="/api/auth/logout-all" method="post">
                <button 
                  type="submit"
                  className={actionStyles('danger')}
                >
                  登出所有裝置
                </button>
              </form>
            </div>
          </div>
        </div>

        <AlertsSyncPanel />
      </main>
    </div>
  );
}


