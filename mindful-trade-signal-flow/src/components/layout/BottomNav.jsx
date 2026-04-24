import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Search, Eye, Bell, UserCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getAlertsUnreadCount } from '@/lib/api';
import { QUERY_KEYS } from '@/lib/api/queryKeys';

const tabs = [
  { path: '/',          icon: LayoutDashboard, label: 'Home'      },
  { path: '/search',    icon: Search,          label: 'Search'    },
  { path: '/watchlist', icon: Eye,             label: 'Watchlist' },
  { path: '/alerts',    icon: Bell,            label: 'Alerts'    },
  { path: '/settings',  icon: UserCircle,      label: 'Account'   },
];

// Detail routes — bottom nav stays visible but no tab is highlighted
const DETAIL_PREFIXES = ['/politician', '/issuer', '/openinsider', '/paywall'];

export default function BottomNav() {
  const location = useLocation();
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

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/85 backdrop-blur-xl border-t border-border/50">
      {/* iOS safe area spacer */}
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-1">
        {tabs.map(({ path, icon: Icon, label }) => {
          const isActive = activeTab === path;
          return (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 min-w-[56px] rounded-xl transition-colors relative ${
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="relative">
                <Icon className={`h-5 w-5 transition-all ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                {path === '/alerts' && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-sell rounded-full border border-background" />
                )}
              </div>
              <span className={`text-[9px] tracking-wide ${isActive ? 'font-bold' : 'font-medium'}`}>
                {label}
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
  );
}