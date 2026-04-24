import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Eye, ChevronRight, Plus, Bell } from 'lucide-react';
import TradeCard from '@/components/insider/TradeCard';
import SkeletonTradeCard from '@/components/insider/SkeletonTradeCard';

function EmptyWatchlistCard() {
  return (
    <div className="bg-card rounded-xl border border-dashed border-border p-6 flex flex-col items-center text-center gap-3">
      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
        <Eye className="h-5 w-5 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-semibold mb-1">Your watchlist is empty</p>
        <p className="text-xs text-muted-foreground">
          Track politicians and stocks to see their latest trades here.
        </p>
      </div>
      <Link
        to="/watchlist"
        className="flex items-center gap-1.5 text-xs font-semibold text-primary"
      >
        <Plus className="h-3.5 w-3.5" />
        Add to Watchlist
      </Link>
    </div>
  );
}

function AlertActivityRow({ alert, onNavigate }) {
  const sub = alert.ticker
    ? `${alert.type === 'corporate' ? 'Corporate' : 'Watchlist'} · ${alert.ticker}`
    : (alert.type || 'alert');
  return (
    <button
      type="button"
      onClick={() => onNavigate(alert)}
      className="w-full text-left bg-card rounded-xl border border-border/50 p-4 hover:border-border transition-all active:scale-[0.99]"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
          <Bell className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm truncate">{alert.title}</p>
          <p className="text-xs text-muted-foreground truncate">{sub}</p>
          <p className="text-[10px] text-muted-foreground mt-1">
            {alert.timestamp
              ? formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })
              : ''}
          </p>
        </div>
      </div>
    </button>
  );
}

export default function WatchlistActivityPanel({ trades, alerts, isLoading, type = 'politician' }) {
  const navigate = useNavigate();
  const alertMode = Array.isArray(alerts);

  const goAlert = (alert) => {
    if (alert.ticker) {
      navigate(`/issuer?ticker=${encodeURIComponent(alert.ticker)}`);
      return;
    }
    navigate('/alerts');
  };

  return (
    <div className="px-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Watchlist Activity</h2>
        <Link
          to="/watchlist"
          className="flex items-center gap-0.5 text-xs text-primary font-medium"
        >
          View all <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <SkeletonTradeCard />
          <SkeletonTradeCard />
          <SkeletonTradeCard />
        </div>
      ) : alertMode ? (
        !alerts.length ? (
          <EmptyWatchlistCard />
        ) : (
          <div className="space-y-2">
            {alerts.slice(0, 5).map((a) => (
              <AlertActivityRow key={a.id} alert={a} onNavigate={goAlert} />
            ))}
          </div>
        )
      ) : !trades || trades.length === 0 ? (
        <EmptyWatchlistCard />
      ) : (
        <div className="space-y-2">
          {trades.slice(0, 5).map((trade) => (
            <TradeCard
              key={trade.id}
              trade={trade}
              type={type}
              onClick={() => {}}
            />
          ))}
        </div>
      )}
    </div>
  );
}