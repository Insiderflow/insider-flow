import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { appClient } from '@/api/appClient';
import { useToast } from '@/components/ui/use-toast';
import { Check, X, Zap, ArrowLeft, RotateCcw } from 'lucide-react';
import { usesNativeStoreBilling } from '@/lib/nativeRuntime';

const IS_IOS_UA = /iphone|ipad|ipod/i.test(navigator.userAgent);

const FEATURES = [
  { label: 'Politician trade feed',         free: true,  paid: true },
  { label: 'Corporate insider feed',        free: true,  paid: true },
  { label: 'Basic search',                  free: true,  paid: true },
  { label: 'Watchlist (up to 5 items)',     free: true,  paid: true },
  { label: 'Unlimited watchlist',           free: false, paid: true },
  { label: 'Real-time trade alerts',        free: false, paid: true },
  { label: 'OpenInsider Explorer',          free: false, paid: true },
  { label: 'Notable trade signals',         free: false, paid: true },
  { label: 'Politician profile analytics',  free: false, paid: true },
  { label: 'Weekly digest email',           free: false, paid: true },
  { label: 'Priority data updates',         free: false, paid: true },
];

function FeatureRow({ label, free, paid }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border/20 last:border-0">
      <span className="flex-1 text-xs text-foreground">{label}</span>
      <span className="w-10 flex justify-center">
        {free
          ? <Check className="h-3.5 w-3.5 text-muted-foreground" />
          : <X className="h-3.5 w-3.5 text-border" />}
      </span>
      <span className="w-10 flex justify-center">
        {paid
          ? <Check className="h-3.5 w-3.5 text-buy" />
          : <X className="h-3.5 w-3.5 text-border" />}
      </span>
    </div>
  );
}

export default function Paywall() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const priceId = import.meta.env.VITE_STRIPE_PRICE_ID;

  useEffect(() => {
    if (user?.subscription_status === 'active' || user?.membership_tier === 'pro') {
      navigate('/settings', { replace: true });
    }
  }, [user?.subscription_status, user?.membership_tier, navigate]);

  const handleUpgrade = async () => {
    if (IS_IOS) {
      // Trigger StoreKit purchase — replace with your RevenueCat / StoreKit bridge call
      toast({ title: 'Opening in-app purchase…' });
      // window.webkit?.messageHandlers?.storeKit?.postMessage({ productId: 'insiderflow.pro.monthly' });
      return;
    }
    // Web: Stripe Checkout
    setLoading(true);
    try {
      if (!priceId) {
        throw new Error('VITE_STRIPE_PRICE_ID missing');
      }
      const res = await appClient.functions.invoke('stripeCheckout', { priceId, return_url: window.location.href });
      if (res.data?.url) window.location.href = res.data.url;
    } catch {
      toast({ title: 'Could not start checkout', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!usesNativeStoreBilling()) return;
    setRestoring(true);
    await new Promise(r => setTimeout(r, 1200));
    // Replace with: window.webkit?.messageHandlers?.storeKit?.postMessage({ action: 'restorePurchases' });
    toast({ title: 'Purchases restored', description: 'No active subscription found.' });
    setRestoring(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border/50 flex items-center px-4 h-14 gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-base font-semibold">Upgrade to Pro</h1>
      </div>

      <div className="flex-1 px-4 pt-5 pb-36 space-y-6 overflow-y-auto">
        {/* Hero */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/15 mb-2">
            <Zap className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-xl font-bold">Insider Flow Pro</h2>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Full access to every signal — politician filings, corporate Form 4s, and real-time alerts.
          </p>
          <div className="inline-flex items-baseline gap-1 pt-1">
            <span className="text-3xl font-bold">$9.99</span>
            <span className="text-sm text-muted-foreground">/ month</span>
          </div>
        </div>

        {/* Feature comparison */}
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 bg-secondary/40 border-b border-border/30">
            <span className="flex-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Feature</span>
            <span className="w-10 text-center text-xs font-semibold text-muted-foreground">Free</span>
            <span className="w-10 text-center text-xs font-bold text-primary">Pro</span>
          </div>
          <div className="px-4">
            {FEATURES.map(f => <FeatureRow key={f.label} {...f} />)}
          </div>
        </div>

        {/* Trust badges */}
        <div className="grid grid-cols-3 gap-2">
          {['Cancel anytime', 'No hidden fees', 'SEC-grade data'].map(t => (
            <div key={t} className="bg-secondary/50 rounded-xl px-2 py-2.5 text-center">
              <p className="text-[10px] font-medium text-muted-foreground leading-snug">{t}</p>
            </div>
          ))}
        </div>

        {(usesNativeStoreBilling() || IS_IOS_UA) && (
          <p className="text-[10px] text-muted-foreground text-center leading-relaxed px-4">
            Payment will be charged to your Apple ID account at confirmation of purchase. Subscription automatically renews unless auto-renew is turned off at least 24 hours before the end of the current period. Manage subscriptions in your App Store account settings.
          </p>
        )}
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-8 pt-3 bg-gradient-to-t from-background via-background/95 to-transparent space-y-2">
        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="w-full h-14 rounded-2xl bg-primary text-primary-foreground text-base font-bold shadow-lg shadow-primary/30 disabled:opacity-70 flex items-center justify-center gap-2"
        >
          {loading ? (
            <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Processing…</span>
          ) : usesNativeStoreBilling() ? (
            '✦ Subscribe — $9.99/mo'
          ) : (
            '✦ Start Pro — $9.99/mo'
          )}
        </button>
        {usesNativeStoreBilling() && (
          <button
            onClick={handleRestore}
            disabled={restoring}
            className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground py-1 disabled:opacity-60"
          >
            <RotateCcw className="h-3 w-3" />
            {restoring ? 'Restoring…' : 'Restore purchases'}
          </button>
        )}
      </div>
    </div>
  );
}