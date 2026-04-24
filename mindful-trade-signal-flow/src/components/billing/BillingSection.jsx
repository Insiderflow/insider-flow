import React, { useState } from 'react';
import { CreditCard } from 'lucide-react';
import SettingsCard from '@/components/settings/SettingsCard';
import PlanStatusCard from './PlanStatusCard';
import { appClient } from '@/api/appClient';
import { useToast } from '@/components/ui/use-toast';

export default function BillingSection({ billingData }) {
  const { toast } = useToast();
  const [loadingPortal, setLoadingPortal] = useState(false);

  const openStripePortal = async () => {
    if (billingData.billingProvider !== 'stripe') return;
    setLoadingPortal(true);
    try {
      const res = await appClient.functions.invoke('stripePortal', { return_url: window.location.href });
      if (res.data?.url) window.location.href = res.data.url;
    } catch {
      toast({ title: 'Could not open billing portal', variant: 'destructive' });
    } finally {
      setLoadingPortal(false);
    }
  };

  return (
    <SettingsCard icon={CreditCard} title="Subscription & Billing" iconBg="bg-primary/10" iconColor="text-primary">
      <PlanStatusCard
        status={billingData?.status || 'free'}
        expiresAt={billingData?.expiresAt || null}
        renewsAt={billingData?.renewsAt || null}
        billingProvider={billingData?.billingProvider || null}
        onManage={openStripePortal}
      />
    </SettingsCard>
  );
}