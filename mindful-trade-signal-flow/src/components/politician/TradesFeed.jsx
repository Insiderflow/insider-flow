import React from 'react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown } from 'lucide-react';
import EmptyState from '@/components/insider/EmptyState';
import { ShoppingBag } from 'lucide-react';

function TradeRow({ trade }) {
  const isBuy = trade.trade_type === 'Buy';

  return (
    <div className="flex items-center gap-3 py-3 border-b border-border/30 last:border-0">
      {/* Direction indicator */}
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
        isBuy ? 'bg-buy/10' : 'bg-sell/10'
      }`}>
        {isBuy
          ? <TrendingUp className="h-4 w-4 text-buy" />
          : <TrendingDown className="h-4 w-4 text-sell" />
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-mono text-sm font-bold text-primary">{trade.ticker}</span>
          <span className="text-xs text-muted-foreground truncate">{trade.company_name}</span>
        </div>
        <p className="text-[11px] text-muted-foreground">
          {trade.trade_date ? format(new Date(trade.trade_date), 'MMM d, yyyy') : '—'}
          {trade.disclosure_date && (
            <span className="ml-2 opacity-60">
              · disclosed {format(new Date(trade.disclosure_date), 'MMM d')}
            </span>
          )}
        </p>
      </div>

      {/* Amount + badge */}
      <div className="text-right flex-shrink-0">
        <p className={`text-xs font-semibold ${isBuy ? 'text-buy' : 'text-sell'}`}>
          {isBuy ? 'BUY' : 'SELL'}
        </p>
        <p className="text-[11px] text-muted-foreground tabular-nums">{trade.amount_range || '—'}</p>
      </div>
    </div>
  );
}

export default function TradesFeed({ trades, isLoading }) {
  if (isLoading) {
    return (
      <div className="px-4 space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-3 items-center py-2">
            <Skeleton className="w-8 h-8 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-3 w-40" />
            </div>
            <Skeleton className="h-3.5 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (!trades || trades.length === 0) {
    return (
      <div className="px-4">
        <EmptyState
          icon={ShoppingBag}
          title="No trades on record"
          description="This politician has no disclosed trades yet."
        />
      </div>
    );
  }

  return (
    <div className="px-4">
      <div className="divide-y divide-border/30">
        {trades.map((trade, idx) => (
          <TradeRow key={trade.id || idx} trade={trade} />
        ))}
      </div>
    </div>
  );
}