import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, AlertTriangle, Clock, XCircle, RefreshCw, ExternalLink } from 'lucide-react';

const IS_IOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

// status: 'free' | 'active' | 'trialing' | 'grace_period' | 'expired' | 'canceled'
const STATUS_CONFIG = {
  free: {
    icon: null,
    bg: 'bg-secondary/60',
    badge: null,
    title: 'Free Plan',
    desc: 'Upgrade to unlock all features',
    cta: 'Upgrade to Pro',
    ctaStyle: 'bg-primary text-primary-foreground',
  },
  active: {
    icon: Crown,
    iconColor: 'text-warning-color',
    bg: 'bg-buy/5 border-buy/20',
    badge: { label: 'Active', color: 'bg-buy/10 text-buy' },
    title: 'Insider Flow Pro',
    ctaStyle: 'bg-secondary text-foreground',
  },
  trialing: {
    icon: Clock,
    iconColor: 'text-primary',
    bg: 'bg-primary/5 border-primary/20',
    badge: { label: 'Trial', color: 'bg-primary/10 text-primary' },
    title: 'Pro Trial',
    ctaStyle: 'bg-primary text-primary-foreground',
  },
  grace_period: {
    icon: AlertTriangle,
    iconColor: 'text-warning-color',
    bg: 'bg-warning/5 border-warning-color/20',
    badge: { label: 'Grace Period', color: 'bg-warning/10 text-warning-color' },
    title: 'Payment Issue',
    desc: 'Update your payment method to keep Pro access.',
    ctaStyle: 'bg-warning-color text-white',
  },
  expired: {
    icon: XCircle,
    iconColor: 'text-sell',
    bg: 'bg-sell/5 border-sell/20',
    badge: { label: 'Expired', color: 'bg-sell/10 text-sell' },
    title: 'Subscription Expired',
    desc: 'Renew to regain access to Pro features.',
    ctaStyle: 'bg-sell text-white',
  },
  canceled: {
    icon: XCircle,
    iconColor: 'text-muted-foreground',
    bg: 'bg-secondary/60',
    badge: { label: 'Canceled', color: 'bg-secondary text-muted-foreground' },
    title: 'Canceled',
    desc: 'Your plan has been canceled. Resubscribe anytime.',
    ctaStyle: 'bg-primary text-primary-foreground',
  },
};

function formatDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function PlanStatusCard({ status = 'free', expiresAt, renewsAt, billingProvider, onManage, onUpgrade }) {
  const navigate = useNavigate();
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.free;
  const Icon = cfg.icon;

  const isPaid = ['active', 'trialing', 'grace_period'].includes(status);
  const needsAction = ['free', 'expired', 'canceled', 'grace_period'].includes(status);

  const handleManage = () => {
    if (status === 'free' || status === 'expired' || status === 'canceled') {
      navigate('/paywall');
      return;
    }
    if (billingProvider === 'apple') {
      // iOS: deep link to Apple subscription management
      window.location.href = 'https://apps.apple.com/account/subscriptions';
    } else if (billingProvider === 'stripe') {
      onManage?.();
    }
  };

  const ctaLabel = () => {
    if (status === 'free') return 'Upgrade to Pro';
    if (status === 'expired' || status === 'canceled') return 'Resubscribe';
    if (status === 'grace_period') return billingProvider === 'apple' ? 'Manage in App Store' : 'Update Payment';
    if (status === 'active' || status === 'trialing') {
      return billingProvider === 'apple' ? 'Manage in App Store' : 'Manage Billing';
    }
    return 'Manage';
  };

  return (
    <div className={`rounded-2xl border p-4 space-y-3 ${cfg.bg}`}>
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="w-9 h-9 rounded-xl bg-background/50 flex items-center justify-center flex-shrink-0">
            <Icon className={`h-5 w-5 ${cfg.iconColor}`} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold">{cfg.title}</p>
            {cfg.badge && (
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.badge.color}`}>
                {cfg.badge.label}
              </span>
            )}
          </div>
          {cfg.desc && <p className="text-xs text-muted-foreground mt-0.5">{cfg.desc}</p>}
          {renewsAt && isPaid && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Renews {formatDate(renewsAt)}
            </p>
          )}
          {expiresAt && !isPaid && status !== 'free' && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Expired {formatDate(expiresAt)}
            </p>
          )}
          {status === 'trialing' && expiresAt && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Trial ends {formatDate(expiresAt)}
            </p>
          )}
        </div>
      </div>

      <button
        onClick={handleManage}
        className={`w-full h-10 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 ${cfg.ctaStyle}`}
      >
        {ctaLabel()}
        {(billingProvider === 'apple' && isPaid) && <ExternalLink className="h-3.5 w-3.5 opacity-70" />}
      </button>

      {IS_IOS && billingProvider === 'apple' && isPaid && (
        <p className="text-[10px] text-muted-foreground text-center">
          Subscriptions managed via App Store
        </p>
      )}
    </div>
  );
}