import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { getDashboardStats, getPoliticianTrades, getCorporateTrades } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import SummaryStrip from '@/components/dashboard/SummaryStrip';
import WatchlistActivityPanel from '@/components/dashboard/WatchlistActivityPanel';
import RecentActivityFeed from '@/components/dashboard/RecentActivityFeed';
import QuickActions from '@/components/dashboard/QuickActions';
import PaywallBanner from '@/components/dashboard/PaywallBanner';
import ErrorRetry from '@/components/dashboard/ErrorRetry';
import { useTranslation } from '@/lib/useTranslation';

const MOCK_STATS = {
  buysToday: 47,
  sellsToday: 83,
  activeTraders: 31,
  buysDelta: '+12 vs yesterday',
  sellsDelta: '+5 vs yesterday',
  activeDelta: 'this week',
};

const LATEST_DATE = new Date().toISOString().split('T')[0];

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [politicianTrades, setPoliticianTrades] = useState([]);
  const [corporateTrades, setCorporateTrades] = useState([]);
  const [watchlistTrades, setWatchlistTrades] = useState([]);
  const [stats, setStats] = useState(MOCK_STATS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPaywall, setShowPaywall] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    const [dashboardStats, pTrades, cTrades] = await Promise.all([
      getDashboardStats(),
      getPoliticianTrades({ limit: 50 }),
      getCorporateTrades({ limit: 50 }),
    ]);
    setStats(dashboardStats || MOCK_STATS);
    setPoliticianTrades(pTrades);
    setCorporateTrades(cTrades);
    setWatchlistTrades(pTrades.filter((t) => t.notable).slice(0, 3));
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Insider Flow" />

      <div className="space-y-5 py-4">
        {/* Summary Strip */}
        <SummaryStrip
          stats={stats}
          latestDate={LATEST_DATE}
          isLoading={isLoading}
        />

        {/* Error state */}
        {error && !isLoading && (
          <ErrorRetry message={error} onRetry={loadData} />
        )}

        {/* Quick Actions */}
        <QuickActions />

        {/* Watchlist Activity */}
        {!error && (
          <WatchlistActivityPanel
            alerts={watchlistTrades}
            isLoading={isLoading}
          />
        )}

        {/* Premium upsell — only for free/logged-out users */}
        {showPaywall && user?.membership_tier !== 'pro' && (
          <PaywallBanner onDismiss={() => setShowPaywall(false)} />
        )}

        {/* Recent Activity Feed */}
        {!error && (
          <RecentActivityFeed
            politicianTrades={politicianTrades}
            corporateTrades={corporateTrades}
            isLoading={isLoading}
          />
        )}

        {/* Bottom spacer for nav */}
        <div className="h-4" />
      </div>
    </div>
  );
}