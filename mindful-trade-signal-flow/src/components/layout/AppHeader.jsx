import React from 'react';
import { Bell, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getAlertsUnreadCount } from '@/lib/api';
import { QUERY_KEYS } from '@/lib/api/queryKeys';

export default function AppHeader({ title, showSearch = false, onSearchClick }) {
  const navigate = useNavigate();
  const handleSearch = onSearchClick || (() => navigate('/search'));
  const { data: unreadCount = 0 } = useQuery({
    queryKey: QUERY_KEYS.alertsUnreadCount,
    queryFn: getAlertsUnreadCount,
    staleTime: 30_000,
    refetchOnMount: false,
  });
  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xs">IF</span>
          </div>
          <h1 className="text-lg font-semibold tracking-tight">{title || 'Insider Flow'}</h1>
        </div>
        <div className="flex items-center gap-1">
          {showSearch && (
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleSearch}>
              <Search className="h-4 w-4" />
            </Button>
          )}
          <Link to="/alerts">
            <Button variant="ghost" size="icon" className="h-9 w-9 relative">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-sell rounded-full" />
              )}
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}