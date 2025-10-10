'use client';

import { useState } from 'react';

export default function Upgrade() {
  const [loading, setLoading] = useState<string | null>(null);

  const startCheckout = async (priceId: string, planName: string) => {
    setLoading(planName);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Checkout failed');
      }
    } catch (error) {
      alert('Checkout failed. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const plans = [
    {
      name: '月方案',
      nameEn: 'Monthly',
      price: 'US$ 10',
      period: '/月',
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY!,
      popular: false,
      features: [
        '完整內幕交易數據',
        '即時交易通知',
        '政治人物追蹤',
        '公司股票監控',
        '郵件通知服務'
      ]
    },
    {
      name: '年方案',
      nameEn: 'Yearly',
      price: 'US$ 100',
      period: '/年',
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_YEARLY!,
      popular: true,
      features: [
        '完整內幕交易數據',
        '即時交易通知',
        '政治人物追蹤',
        '公司股票監控',
        '郵件通知服務',
        '節省 17% 年費',
        '優先客戶支援'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            <span className="zh-Hant">升級為付費會員</span>
            <span className="zh-Hans hidden">升级为付费会员</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            <span className="zh-Hant">解鎖完整內幕交易數據，掌握政治人物和企業高層的股票交易動向</span>
            <span className="zh-Hans hidden">解锁完整内幕交易数据，掌握政治人物和企业高层的股票交易动向</span>
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-gray-800 border-2 rounded-xl p-8 ${
                plan.popular 
                  ? 'border-blue-500 shadow-2xl shadow-blue-500/20' 
                  : 'border-gray-600'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                    <span className="zh-Hant">最受歡迎</span>
                    <span className="zh-Hans hidden">最受欢迎</span>
                  </span>
                </div>
              )}
              
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center mb-4">
                  <span className="text-5xl font-bold">{plan.price}</span>
                  <span className="text-gray-400 ml-2">{plan.period}</span>
                </div>
                {plan.popular && (
                  <p className="text-green-400 text-sm font-medium">
                    <span className="zh-Hant">相比月方案節省 17% (US$ 20)</span>
                    <span className="zh-Hans hidden">相比月方案节省 17% (US$ 20)</span>
                  </p>
                )}
              </div>

              {/* Features */}
              <div className="mb-8">
                <h4 className="text-lg font-semibold mb-4">
                  <span className="zh-Hant">包含功能</span>
                  <span className="zh-Hans hidden">包含功能</span>
                </h4>
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <svg className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA Button */}
              <button
                onClick={() => startCheckout(plan.priceId, plan.nameEn)}
                disabled={loading === plan.nameEn}
                className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all duration-200 ${
                  plan.popular
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                } ${loading === plan.nameEn ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading === plan.nameEn ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="zh-Hant">處理中...</span>
                    <span className="zh-Hans hidden">处理中...</span>
                  </span>
                ) : (
                  <>
                    <span className="zh-Hant">立即訂閱 {plan.name}</span>
                    <span className="zh-Hans hidden">立即订阅 {plan.name}</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">
            <span className="zh-Hant">常見問題</span>
            <span className="zh-Hans hidden">常见问题</span>
          </h2>
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">
                <span className="zh-Hant">如何取消訂閱？</span>
                <span className="zh-Hans hidden">如何取消订阅？</span>
              </h3>
              <p className="text-gray-300">
                <span className="zh-Hant">您可以在帳戶設定中管理您的訂閱，隨時取消或修改。</span>
                <span className="zh-Hans hidden">您可以在账户设置中管理您的订阅，随时取消或修改。</span>
              </p>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">
                <span className="zh-Hant">付款安全嗎？</span>
                <span className="zh-Hans hidden">付款安全吗？</span>
              </h3>
              <p className="text-gray-300">
                <span className="zh-Hant">我們使用 Stripe 處理付款，符合最高安全標準。</span>
                <span className="zh-Hans hidden">我们使用 Stripe 处理付款，符合最高安全标准。</span>
              </p>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">
                <span className="zh-Hant">可以退款嗎？</span>
                <span className="zh-Hans hidden">可以退款吗？</span>
              </h3>
              <p className="text-gray-300">
                <span className="zh-Hant">我們提供 7 天退款保證，如有任何問題請聯繫客服。</span>
                <span className="zh-Hans hidden">我们提供 7 天退款保证，如有任何问题请联系客服。</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


