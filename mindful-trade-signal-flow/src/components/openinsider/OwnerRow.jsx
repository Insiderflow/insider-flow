import React from 'react';
import { format } from 'date-fns';
import { ChevronRight } from 'lucide-react';

export default function OwnerRow({ owner, onClick }) {
  const initials = owner.owner_name?.split(' ').map(n => n[0]).slice(0, 2).join('') || '?';

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-card rounded-xl border border-border/50 px-4 py-3.5 flex items-center gap-3 hover:border-border transition-all active:scale-[0.99]"
    >
      <div className="w-10 h-10 rounded-full bg-secondary border border-border/50 flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-bold text-muted-foreground">{initials}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{owner.owner_name}</p>
        <div className="flex items-center gap-1 mt-0.5">
          {owner.owner_title && (
            <span className="text-[11px] text-muted-foreground truncate">{owner.owner_title}</span>
          )}
          {owner.company_name && (
            <span className="text-[11px] text-muted-foreground truncate">· {owner.company_name}</span>
          )}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        {owner.trade_count > 0 && (
          <p className="text-xs font-semibold tabular-nums">{owner.trade_count} trades</p>
        )}
        {owner.last_trade_date && (
          <p className="text-[10px] text-muted-foreground">
            {format(new Date(owner.last_trade_date), 'MMM d')}
          </p>
        )}
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-1" />
    </button>
  );
}