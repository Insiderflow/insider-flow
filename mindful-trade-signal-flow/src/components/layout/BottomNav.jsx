import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Search, Eye, Bell, UserCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getAlertsUnreadCount } from '@/lib/api';
import { QUERY_KEYS } from '@/lib/api/queryKeys';
import { useTranslation } from '@/lib/useTranslation';
import { useAuth } from '@/lib/AuthContext';
import SubscriberOnlyDialog from '@/components/billing/SubscriberOnlyDialog';

const tabs = [
  { path: '/',          icon: LayoutDashboard, labelKey: 'navHome' },
  { path: '/search',    icon: Search,          labelKey: 'navSearch' },
  { path: '/watchlist', icon: Eye,             labelKey: 'navWatchlist' },
  { path: '/alerts',    icon: Bell,            labelKey: 'navAlerts' },
  { path: '/settings',  icon: UserCircle,      labelKey: 'navAccount' },
];

// Detail routes — bottom nav stays visible but no tab is highlighted
const DETAIL_PREFIXES = ['/politician', '/issuer', '/openinsider', '/paywall'];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const { data: unreadCount = 0 } = useQuery({
    queryKey: QUERY_KEYS.alertsUnreadCount,
    queryFn: getAlertsUnreadCount,
    staleTime: 30_000,
    refetchOnMount: false,
  });

  const activeTab = tabs.find(t =>
    t.path === '/'
      ? location.pathname === '/'
      : location.pathname.startsWith(t.path)
  )?.path ?? null;
  const isFreeUser = !user || user.membership_tier !== 'pro';

  const handleRestrictedClick = (e, path) => {
    if (isFreeUser && (path === '/watchlist' || path === '/alerts')) {
      e.preventDefault();
      setDialogOpen(true);
    }
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/85 backdrop-blur-xl border-t border-border/50">
        {/* iOS safe area spacer */}
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-1">
          {tabs.map(({ path, icon: Icon, labelKey }) => {
            const isActive = activeTab === path;
            return (
              <Link
                key={path}
                to={path}
                onClick={(e) => handleRestrictedClick(e, path)}
                className={`flex flex-col items-center gap-0.5 px-2 py-1.5 min-w-[56px] rounded-xl transition-all duration-200 relative motion-press ${
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className="relative">
                  <Icon className={`h-5 w-5 transition-all duration-200 ${isActive ? 'stroke-[2.5] -translate-y-[1px]' : 'stroke-[1.8]'}`} />
                  {path === '/alerts' && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-sell rounded-full border border-background" />
                  )}
                </div>
                <span className={`text-[9px] tracking-wide ${isActive ? 'font-bold' : 'font-medium'}`}>
                  {t(labelKey)}
                </span>
                {isActive && (
                  <span className="absolute -top-0 left-1/2 -translate-x-1/2 h-0.5 w-6 bg-primary rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
        {/* iOS home indicator spacer */}
        <div className="h-safe-area-inset-bottom" />
      </nav>

      <SubscriberOnlyDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onUpgrade={() => navigate('/paywall')}
      />
    </>
  );
}