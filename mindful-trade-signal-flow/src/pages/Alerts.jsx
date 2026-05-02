import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Bell, TrendingUp, Landmark, Bookmark, AlertTriangle, CheckCheck, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import AppHeader from '@/components/layout/AppHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { getAlerts, markAlertRead, markAllAlertsRead } from '@/lib/api';
import { QUERY_KEYS } from '@/lib/api/queryKeys';
import { useTranslation } from '@/lib/useTranslation';
import { useAuth } from '@/lib/AuthContext';
import SubscriberOnlyDialog from '@/components/billing/SubscriberOnlyDialog';

const ALERT_ICONS = {
  notable_trade: { icon: AlertTriangle, bg: 'bg-warning/10', color: 'text-warning-color' },
  politician:    { icon: Landmark,      bg: 'bg-blue-500/10', color: 'text-blue-400'   },
  watchlist:     { icon: Bookmark,      bg: 'bg-purple-500/10', color: 'text-purple-400' },
  corporate:     { icon: TrendingUp,    bg: 'bg-primary/10',  color: 'text-primary'    },
  seat_alignment:{ icon: AlertTriangle, bg: 'bg-amber-500/10', color: 'text-amber-400' },
};

function AlertRow({ alert, onPress }) {
  const cfg = ALERT_ICONS[alert.type] || ALERT_ICONS.corporate;
  const Icon = cfg.icon;

  return (
    <button
      onClick={() => onPress(alert)}
      className={`w-full text-left flex items-start gap-3 px-4 py-3.5 border-b border-border/30 last:border-0 transition-colors hover:bg-secondary/30 ${
        !alert.read ? 'bg-primary/[0.03]' : ''
      }`}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${cfg.bg}`}>
        <Icon className={`h-4 w-4 ${cfg.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className={`text-sm leading-snug ${!alert.read ? 'font-semibold' : 'font-medium'}`}>
            {alert.title}
          </p>
          {!alert.read && (
            <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary" />
          )}
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{alert.body}</p>
        <div className="flex items-center gap-1 mt-1.5">
          <Clock className="h-2.5 w-2.5 text-muted-foreground/60" />
          <span className="text-[10px] text-muted-foreground/60">
            {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
          </span>
          {alert.ticker && (
            <>
              <span className="text-muted-foreground/40 mx-1">·</span>
              <span className="font-mono text-[10px] text-primary font-semibold">{alert.ticker}</span>
            </>
          )}
        </div>
      </div>
    </button>
  );
}

function AlertsSkeleton() {
  return (
    <div className="divide-y divide-border/30">
      {Array(5).fill(0).map((_, i) => (
        <div key={i} className="flex items-start gap-3 px-4 py-3.5">
          <Skeleton className="w-9 h-9 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-48" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-2.5 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Alerts() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [filter, setFilter] = useState('all');
  const isFreeUser = !user || user.membership_tier !== 'pro';

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: getAlerts,
  });

  const markReadMutation = useMutation({
    mutationFn: markAlertRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.alerts });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.alertsUnreadCount });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllAlertsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.alerts });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.alertsUnreadCount });
    },
  });

  const unreadCount = alerts.filter(a => !a.read).length;

  const filtered = filter === 'unread'
    ? alerts.filter(a => !a.read)
    : alerts;

  const handlePress = (alert) => {
    if (!alert.read) {
      markReadMutation.mutate(alert.id);
    }
    if (alert.ticker) navigate(`/issuer?ticker=${encodeURIComponent(alert.ticker)}`);
  };

  if (isFreeUser) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader title="Alerts" />
        <SubscriberOnlyDialog
          open
          onOpenChange={(v) => {
            if (!v) navigate('/');
          }}
          onUpgrade={() => navigate('/paywall')}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <AppHeader title="Alerts" />

      {/* Filter bar */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div className="flex gap-1 bg-secondary rounded-lg p-1">
          {['all', 'unread'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-all ${
                filter === f ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {(f === 'all' ? t('all') : t('unread'))}{f === 'unread' && unreadCount > 0 ? ` (${unreadCount})` : ''}
            </button>
          ))}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className="flex items-center gap-1.5 text-xs text-primary font-semibold disabled:opacity-60"
          >
            <CheckCheck className="h-3.5 w-3.5" /> {t('markAllRead')}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="bg-card mx-4 rounded-2xl border border-border/50 overflow-hidden">
        {isLoading ? (
          <AlertsSkeleton />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mb-3">
              <Bell className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold mb-1">
              {filter === 'unread' ? t('allCaughtUp') : t('noAlertsYet')}
            </p>
            <p className="text-xs text-muted-foreground max-w-[220px]">
              {filter === 'unread'
                ? t('noUnreadAlerts')
                : t('addWatchlistForAlerts')}
            </p>
          </div>
        ) : (
          <div>
            {filtered.map(alert => (
              <AlertRow key={alert.id} alert={alert} onPress={handlePress} />
            ))}
          </div>
        )}
      </div>

      {/* Upgrade nudge */}
      {!isLoading && (
        <div className="mx-4 mt-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 flex items-center gap-3">
          <Bell className="h-4 w-4 text-primary flex-shrink-0" />
          <p className="text-xs text-muted-foreground flex-1">
            {t('proPlanNudge')}
          </p>
          <button
            onClick={() => navigate('/paywall')}
            className="text-xs font-bold text-primary flex-shrink-0"
          >
            {t('upgrade')} →
          </button>
        </div>
      )}
    </div>
  );
}