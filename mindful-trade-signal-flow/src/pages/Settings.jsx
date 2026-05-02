import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import AppHeader from '@/components/layout/AppHeader';
import ProfileSection from '@/components/settings/ProfileSection';
import NotificationsSection from '@/components/settings/NotificationsSection';
import SecuritySection from '@/components/settings/SecuritySection';
import SessionSection from '@/components/settings/SessionSection';
import BillingSection from '@/components/billing/BillingSection';

export default function Settings() {
  const { user } = useAuth();
  const billingData = {
    status:
      user?.subscription_status ||
      (user?.membership_tier === 'PAID' || user?.membership_tier === 'pro' ? 'active' : 'free'),
    billingProvider: user?.billing_provider || null,
    renewsAt: user?.membership_expires_at || null,
    expiresAt: user?.membership_expires_at || null,
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <AppHeader title="Settings" />
      <div className="px-4 pt-4 space-y-3">
        <ProfileSection user={user} />
        <BillingSection billingData={billingData} />
        <NotificationsSection />
        <SecuritySection />
        <SessionSection />
      </div>
    </div>
  );
}