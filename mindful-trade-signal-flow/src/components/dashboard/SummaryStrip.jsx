import React from 'react';
import { format } from 'date-fns';
import { CalendarDays, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import StatTile from '@/components/insider/StatTile';
import { Skeleton } from '@/components/ui/skeleton';

export default function SummaryStrip({ stats, latestDate, isLoading }) {
  if (isLoading) {
    return (
      <div className="px-4 pt-4 space-y-3">
        <Skeleton className="h-4 w-40" />
        <div className="flex gap-2">
          <Skeleton className="h-20 flex-1 rounded-xl" />
          <Skeleton className="h-20 flex-1 rounded-xl" />
          <Skeleton className="h-20 flex-1 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 space-y-3">
      {latestDate && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" />
          <span>Data through <span className="text-foreground font-medium">{format(new Date(latestDate), 'MMMM d, yyyy')}</span></span>
        </div>
      )}
      <div className="flex gap-2">
        <StatTile
          label="Buys Today"
          value={stats?.buysToday ?? '—'}
          change={stats?.buysDelta}
          icon={TrendingUp}
          accent="buy"
        />
        <StatTile
          label="Sells Today"
          value={stats?.sellsToday ?? '—'}
          change={stats?.sellsDelta}
          icon={TrendingDown}
          accent="sell"
        />
        <StatTile
          label="Active"
          value={stats?.activeTraders ?? '—'}
          change={stats?.activeDelta}
          icon={Activity}
          accent="primary"
        />
      </div>
    </div>
  );
}