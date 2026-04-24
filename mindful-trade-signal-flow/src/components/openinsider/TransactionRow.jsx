import React from 'react';
import { format } from 'date-fns';
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';

const TYPE_META = {
  'P': { label: 'BUY', color: 'text-buy', bg: 'bg-buy/10', Icon: TrendingUp },
  'S': { label: 'SELL', color: 'text-sell', bg: 'bg-sell/10', Icon: TrendingDown },
  'S+OE': { label: 'SELL', color: 'text-sell', bg: 'bg-sell/10', Icon: TrendingDown },
  'A': { label: 'AWARD', color: 'text-muted-foreground', bg: 'bg-secondary', Icon: Minus },
  'G': { label: 'GIFT', color: 'text-muted-foreground', bg: 'bg-secondary', Icon: Minus },
};

function formatValue(val) {
  if (!val) return null;
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return `$${val.toLocaleString()}`;
}

export default function TransactionRow({ tx, density = 'comfortable', onCompanyClick, onOwnerClick }) {
  const meta = TYPE_META[tx.transaction_type] || { label: tx.transaction_type, color: 'text-muted-foreground', bg: 'bg-secondary', Icon: Minus };
  const Icon = meta.Icon;
  const isCompact = density === 'compact';

  return (
    <div className={`bg-card rounded-xl border border-border/50 ${isCompact ? 'px-3 py-2.5' : 'px-4 py-3.5'}`}>
      {/* Top row: company + badge */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <button
          onClick={onCompanyClick}
          className="flex items-center gap-2 min-w-0 flex-1"
        >
          <span className="font-mono font-bold text-primary text-sm flex-shrink-0">{tx.ticker}</span>
          <span className={`text-muted-foreground truncate ${isCompact ? 'text-[11px]' : 'text-xs'}`}>
            {tx.company_name}
          </span>
        </button>
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full flex-shrink-0 ${meta.bg}`}>
          <Icon className={`${isCompact ? 'h-2.5 w-2.5' : 'h-3 w-3'} ${meta.color}`} />
          <span className={`font-bold ${isCompact ? 'text-[9px]' : 'text-[10px]'} ${meta.color}`}>{meta.label}</span>
        </div>
      </div>

      {/* Owner row */}
      <button onClick={onOwnerClick} className="flex items-center gap-1.5 mb-2 w-full text-left">
        <div className="w-5 h-5 rounded-full bg-secondary border border-border/40 flex items-center justify-center flex-shrink-0">
          <span className="text-[8px] font-bold text-muted-foreground">
            {tx.owner_name?.split(' ').map(n => n[0]).slice(0, 2).join('')}
          </span>
        </div>
        <span className={`font-medium truncate hover:text-primary transition-colors ${isCompact ? 'text-[11px]' : 'text-xs'}`}>
          {tx.owner_name}
        </span>
        {tx.owner_title && (
          <span className={`text-muted-foreground truncate flex-shrink-0 ${isCompact ? 'text-[10px]' : 'text-[11px]'}`}>
            · {tx.owner_title}
          </span>
        )}
        {tx.notable && <AlertTriangle className="h-3 w-3 text-warning-color flex-shrink-0 ml-auto" />}
      </button>

      {/* Bottom row: value + date */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {(tx.value_numeric || tx.value) && (
            <span className="text-xs font-semibold tabular-nums">
              {tx.value || formatValue(tx.value_numeric)}
            </span>
          )}
          {tx.shares && (
            <span className="text-[10px] text-muted-foreground tabular-nums">
              {tx.shares.toLocaleString()} sh
            </span>
          )}
        </div>
        <div className="text-right">
          <p className="text-[10px] text-muted-foreground tabular-nums">
            Filed: {tx.transaction_date ? format(new Date(tx.transaction_date), 'MMM d, yy') : '—'}
          </p>
          {tx.trade_date && tx.trade_date !== tx.transaction_date && (
            <p className="text-[10px] text-muted-foreground tabular-nums">
              Traded: {format(new Date(tx.trade_date), 'MMM d, yy')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}