'use client';

import { useState } from 'react';

export default function ManageSubscriptionButton() {
  const [loading, setLoading] = useState(false);

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('Portal error:', data);
        const errorMsg = data.error === 'no_subscription' 
          ? '您目前沒有有效的訂閱。請先升級會員。'
          : data.error === 'invalid_customer'
          ? 'Stripe 客戶資料無效，請聯繫客服。'
          : data.error === 'payment_config'
          ? '支付系統配置錯誤，請聯繫客服。'
          : '無法開啟訂閱管理頁面，請稍後再試';
        alert(errorMsg);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('無法取得訂閱管理頁面連結，請稍後再試');
      }
    } catch (err) {
      console.error('Portal request failed:', err);
      alert('無法開啟訂閱管理頁面，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleManageSubscription}
      disabled={loading}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <span className="zh-Hant">載入中...</span>
      ) : (
        <>
          <span className="zh-Hant">管理訂閱</span>
          <span className="zh-Hans hidden">管理订阅</span>
        </>
      )}
    </button>
  );
}

