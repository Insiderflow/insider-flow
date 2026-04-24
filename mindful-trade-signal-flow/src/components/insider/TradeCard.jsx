import React from 'react';
import { format } from 'date-fns';
import { AlertTriangle } from 'lucide-react';
import TradeBadge from './TradeBadge';

export default function TradeCard({ trade, type = 'politician', onClick }) {
  const isPolitician = type === 'politician';
  const name = isPolitician ? trade.politician_name : trade.insider_name;
  const subtitle = isPolitician
    ? `${trade.party || ''} · ${trade.chamber || ''} · ${trade.state || ''}`
    : `${trade.title || ''} · ${trade.company_name || ''}`;
  const amount = isPolitician
    ? trade.amount_range
    : trade.total_value
      ? `$${Number(trade.total_value).toLocaleString()}`
      : '';

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-card rounded-xl border border-border/50 p-4 hover:border-border transition-all active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Avatar — photo if available, fallback to initials */}
          <div className="flex-shrink-0 w-9 h-9 rounded-full overflow-hidden bg-secondary border border-border/50 flex items-center justify-center">
            {trade.avatar_url ? (
              <img
                src={trade.avatar_url}
                alt={name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-[11px] font-bold text-muted-foreground">
                {name ? name.split(' ').map(n => n[0]).slice(0, 2).join('') : '?'}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm truncate">{name}</span>
              {trade.notable && (
                <AlertTriangle className="h-3.5 w-3.5 text-warning-color flex-shrink-0" />
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
          </div>
        </div>
        <TradeBadge type={trade.trade_type} />
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-semibold text-primary">{trade.ticker}</span>
          {trade.company_name && isPolitician && (
            <span className="text-xs text-muted-foreground truncate max-w-[120px]">
              {trade.company_name}
            </span>
          )}
        </div>
        <div className="text-right">
          {amount && <p className="text-xs font-semibold tabular-nums">{amount}</p>}
          <p className="text-[10px] text-muted-foreground">
            {trade.trade_date ? format(new Date(trade.trade_date), 'MMM d, yyyy') : ''}
          </p>
        </div>
      </div>
    </button>
  );
}