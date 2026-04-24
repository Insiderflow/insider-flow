import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import BottomNav from './BottomNav';
import GlobalLoadingBar from './GlobalLoadingBar';
import PageTransition from './PageTransition';
import { getAlertsUnreadCount } from '@/lib/api';
import { QUERY_KEYS } from '@/lib/api/queryKeys';

// Routes where bottom nav is hidden (full-screen detail/flow screens)
const HIDE_NAV_ROUTES = ['/paywall'];

export default function AppLayout() {
  const location = useLocation();
  const hideNav = HIDE_NAV_ROUTES.some(r => location.pathname.startsWith(r));
  useQuery({
    queryKey: QUERY_KEYS.alertsUnreadCount,
    queryFn: getAlertsUnreadCount,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <GlobalLoadingBar />
      <main className={hideNav ? 'min-h-screen' : 'pb-20'}>
        <AnimatePresence mode="wait" initial={false}>
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </AnimatePresence>
      </main>
      {!hideNav && <BottomNav />}
    </div>
  );
}