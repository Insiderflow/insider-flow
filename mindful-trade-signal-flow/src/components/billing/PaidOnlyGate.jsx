import React from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '@/components/layout/AppHeader';
import SubscriberOnlyDialog from '@/components/billing/SubscriberOnlyDialog';
import { useAuth } from '@/lib/AuthContext';

/** Matches Watchlist / Alerts: backend maps paid accounts to `membership_tier === 'pro'`. */
export function isPaidMobileUser(user) {
  return Boolean(user?.membership_tier === 'pro');
}

/**
 * Renders children only for subscribers; otherwise AppHeader + SubscriberOnlyDialog (same UX as Watchlist).
 */
export default function PaidOnlyGate({ headerTitle, children }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!isPaidMobileUser(user)) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader title={headerTitle} />
        <SubscriberOnlyDialog
          open
          onOpenChange={(open) => {
            if (!open) navigate('/');
          }}
          onUpgrade={() => navigate('/paywall')}
        />
      </div>
    );
  }

  return children;
}
