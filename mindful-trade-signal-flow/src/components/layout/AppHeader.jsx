import React from 'react';
import { Bell, Search, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getAlertsUnreadCount } from '@/lib/api';
import { QUERY_KEYS } from '@/lib/api/queryKeys';
import { useLanguage } from '@/lib/LanguageContext';
import { useTranslation } from '@/lib/useTranslation';

export default function AppHeader({ title, showSearch = false, onSearchClick }) {
  const navigate = useNavigate();
  const handleSearch = onSearchClick || (() => navigate('/search'));
  const { language, setLanguage } = useLanguage();
  const { translateHeaderTitle } = useTranslation();
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
          <h1 className="text-ui-title">{translateHeaderTitle(title || 'Insider Flow')}</h1>
        </div>
        <div className="flex items-center gap-1">
          {showSearch && (
            <Button variant="ghost" size="icon" className="tap-icon" onClick={handleSearch}>
              <Search className="h-4 w-4" />
            </Button>
          )}
          {/* Global language switch (top-right) */}
          <div className="flex items-center gap-1 px-1">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="h-10 bg-secondary/40 border border-border/50 rounded-lg text-xs px-2 text-foreground outline-none"
              aria-label="Language"
            >
              <option value="en">EN</option>
              <option value="zh-Hant">繁</option>
              <option value="zh-Hans">简</option>
            </select>
          </div>
          <Link to="/alerts">
            <Button variant="ghost" size="icon" className="tap-icon relative">
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