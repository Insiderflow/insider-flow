'use client';

import { useState } from 'react';
import Link from 'next/link';
import { badgeStyles } from '@/components/badgeStyles';
import { panelSurfaceStyles } from '@/components/surfaceStyles';
import { bodySubtextStyles, sectionTitleStyles } from '@/components/typographyStyles';
import { getSubstackPublishUrl } from '@/lib/siteConfig';

export default function UpgradePricingClient() {
  const [loading, setLoading] = useState<string | null>(null);
  const substackUrl = getSubstackPublishUrl();

  const startCheckout = async (priceId: string, planName: string) => {
    if (!priceId) {
      alert('Price ID is missing. Please contact support.');
      return;
    }

    setLoading(planName);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();

      if (!res.ok) {
        console.error('Checkout error:', data);
        alert(data.details || data.error || 'Checkout failed');
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Checkout failed');
      }
    } catch (err) {
      console.error('Checkout request failed:', err);
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
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY || '',
      popular: false,
      features: [
        '議員／發行商深度頁、圖表與持倉視角',
        '企業內部人（OpenInsider）專區',
        '與免費版相同之 /trades 全表（付費解鎖進階頁）',
        'Stripe 安全結帳 · 7 天內可聯繫客服協商退款',
      ],
    },
    {
      name: '年方案',
      nameEn: 'Yearly',
      price: 'US$ 100',
      period: '/年',
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_YEARLY || '',
      popular: true,
      features: [
        '包含月方案全部能力',
        '年付省約 17%（相當於 US$ 8.33 / 月）',
        '適合長期跟蹤國會倉位與產業輪動',
        '優先回覆產品相關問題（合理範圍內）',
      ],
    },
  ].filter((plan) => plan.priceId);
  const billingUnavailable = plans.length === 0;

  return (
    <>
      {/* urgency + trust strip */}
      <div className="max-w-4xl mx-auto mb-10 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-amber-500/40 bg-amber-950/30 px-4 py-3 text-center">
          <p className="text-amber-200 text-xs font-bold uppercase tracking-wide zh-Hant">早鳥／年付</p>
          <p className="text-amber-200 text-xs font-bold uppercase tracking-wide zh-Hans hidden">早鸟／年付</p>
          <p className="text-amber-100 text-sm mt-1 zh-Hant">年方案省約 17%，隨時可能調整 — 以結帳頁為準</p>
          <p className="text-amber-100 text-sm mt-1 zh-Hans hidden">年方案省约 17%，随时可能调整 — 以结账页为准</p>
          <p lang="en" className="text-[10px] text-amber-200/80 mt-1">
            Yearly saves ~17%; pricing subject to change at checkout.
          </p>
        </div>
        <div className="rounded-xl border border-gray-600 bg-gray-800/50 px-4 py-3 text-center text-sm text-gray-300">
          <p className="font-semibold text-white zh-Hant">Stripe 託管付款</p>
          <p className="font-semibold text-white zh-Hans hidden">Stripe 托管付款</p>
          <p className="mt-1 text-xs zh-Hant">卡資料不經我們伺服器儲存</p>
          <p className="mt-1 text-xs zh-Hans hidden">卡资料不经我们服务器存储</p>
          <p lang="en" className="text-[10px] text-gray-500 mt-1">PCI-grade checkout · card data not stored on our stack.</p>
        </div>
        <div className="rounded-xl border border-emerald-700/50 bg-emerald-950/25 px-4 py-3 text-center text-sm text-gray-300">
          <p className="font-semibold text-emerald-200 zh-Hant">華語投資人優先</p>
          <p className="font-semibold text-emerald-200 zh-Hans hidden">华语投资人优先</p>
          <p className="mt-1 text-xs zh-Hant">介面與週報以繁中為主，簡中可切換</p>
          <p className="mt-1 text-xs zh-Hans hidden">界面与周报以繁中为主，简中可切换</p>
          <p lang="en" className="text-[10px] text-gray-500 mt-1">Built for HK / TW / global Chinese readers.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto mb-10 text-center">
        <Link
          href={substackUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 text-sm font-semibold"
        >
          <span className="zh-Hant">還沒準備付費？先訂閱免費 Substack 週報拿到長文觀點 →</span>
          <span className="zh-Hans hidden">还没准备付费？先订阅免费 Substack 周报拿到长文观点 →</span>
        </Link>
      </div>

      {billingUnavailable && (
        <div className="max-w-3xl mx-auto mb-8 bg-yellow-900/40 border border-yellow-600 rounded-xl p-4">
          <p className="text-yellow-100 font-medium zh-Hant">
            付費暫時無法開通（缺少 Stripe Price 設定）。請稍後再試或聯繫客服。
          </p>
          <p className="text-yellow-100 font-medium zh-Hans hidden">
            付费暂时无法开通（缺少 Stripe Price 设置）。请稍后再试或联系客服。
          </p>
          <p lang="en" className="text-yellow-200/80 text-sm mt-2">
            Billing unavailable: missing <code className="text-yellow-100">NEXT_PUBLIC_STRIPE_PRICE_*</code> env vars.
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative ${panelSurfaceStyles('lg')} border-2 rounded-xl ${
              plan.popular ? 'border-blue-500 shadow-2xl shadow-blue-500/20' : 'border-gray-600'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className={badgeStyles('info')}>
                  <span className="zh-Hant">最多人選</span>
                  <span className="zh-Hans hidden">最多人选</span>
                </span>
              </div>
            )}

            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <div className="flex items-baseline justify-center mb-4">
                <span className="text-5xl font-bold">{plan.price}</span>
                <span className="text-gray-400 ml-2">{plan.period}</span>
              </div>
              {plan.name === '月方案' && (
                <div className="mb-3">
                  <p className="text-yellow-400 text-sm font-bold mb-1 zh-Hant">新客試用</p>
                  <p className="text-yellow-400 text-sm font-bold mb-1 zh-Hans hidden">新客试用</p>
                  <p className="text-yellow-300 text-base font-semibold zh-Hant">
                    結帳輸入優惠碼 <span className="bg-yellow-400 text-gray-900 px-2 py-1 rounded font-mono font-bold">1month</span>
                  </p>
                  <p className="text-yellow-300 text-base font-semibold zh-Hans hidden">
                    结账输入优惠码 <span className="bg-yellow-400 text-gray-900 px-2 py-1 rounded font-mono font-bold">1month</span>
                  </p>
                </div>
              )}
              {plan.popular && (
                <p className="text-green-400 text-sm font-medium">
                  <span className="zh-Hant">相較月付每年省約 US$ 20</span>
                  <span className="zh-Hans hidden">相较月付每年省约 US$ 20</span>
                </p>
              )}
            </div>

            <div className="mb-8">
              <h4 className="text-lg font-semibold mb-4 zh-Hant">你會立刻得到</h4>
              <h4 className="text-lg font-semibold mb-4 zh-Hans hidden">你会立刻得到</h4>
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-400 mr-1 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-gray-300 text-sm leading-snug">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              onClick={() => startCheckout(plan.priceId, plan.nameEn)}
              disabled={loading === plan.nameEn}
              className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
                plan.popular
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
            >
              {loading === plan.nameEn ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span className="zh-Hant">正在前往 Stripe…</span>
                  <span className="zh-Hans hidden">正在前往 Stripe…</span>
                </span>
              ) : (
                <>
                  <span className="zh-Hant">立即解鎖 {plan.name}</span>
                  <span className="zh-Hans hidden">立即解锁 {plan.name}</span>
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-16 max-w-3xl mx-auto">
        <h2 className={`${sectionTitleStyles()} text-center mb-8`}>
          <span className="zh-Hant">常見問題</span>
          <span className="zh-Hans hidden">常见问题</span>
        </h2>
        <div className="space-y-6">
          <div className={panelSurfaceStyles()}>
            <h3 className="text-lg font-semibold mb-2 zh-Hant">如何取消訂閱？</h3>
            <h3 className="text-lg font-semibold mb-2 zh-Hans hidden">如何取消订阅？</h3>
            <p className={bodySubtextStyles()}>
              <span className="zh-Hant">於 Stripe 客戶入口或帳戶內管理訂閱，隨時取消續訂。</span>
              <span className="zh-Hans hidden">于 Stripe 客户入口或账户内管理订阅，随时取消续订。</span>
            </p>
            <p lang="en" className={`${bodySubtextStyles()} text-xs mt-2 text-gray-500`}>
              Manage renewal in the Stripe customer portal from your account email receipt.
            </p>
          </div>
          <div className={panelSurfaceStyles()}>
            <h3 className="text-lg font-semibold mb-2 zh-Hant">付款安全嗎？</h3>
            <h3 className="text-lg font-semibold mb-2 zh-Hans hidden">付款安全吗？</h3>
            <p className={bodySubtextStyles()}>
              <span className="zh-Hant">由 Stripe 處理，符合業界 PCI 標準；我們不儲存完整卡號。</span>
              <span className="zh-Hans hidden">由 Stripe 处理，符合业界 PCI 标准；我们不储存完整卡号。</span>
            </p>
          </div>
          <div className={panelSurfaceStyles()}>
            <h3 className="text-lg font-semibold mb-2 zh-Hant">可以退款嗎？</h3>
            <h3 className="text-lg font-semibold mb-2 zh-Hans hidden">可以退款吗？</h3>
            <p className={bodySubtextStyles()}>
              <span className="zh-Hant">原則上提供 7 天內聯繫客服協商退款；實際依 Stripe 政策與個案為準。</span>
              <span className="zh-Hans hidden">原则上提供 7 天内联系客服协商退款；实际依 Stripe 政策与个案为准。</span>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
