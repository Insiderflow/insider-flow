import React from 'react';
import { format } from 'date-fns';
import { ChevronRight } from 'lucide-react';

export default function CompanyRow({ company, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-card rounded-xl border border-border/50 px-4 py-3.5 flex items-center gap-3 hover:border-border transition-all active:scale-[0.99]"
    >
      <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
        <span className="font-mono font-bold text-primary text-xs">{company.ticker?.slice(0, 4)}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{company.company_name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="font-mono text-xs text-primary">{company.ticker}</span>
          {company.sector && (
            <span className="text-[11px] text-muted-foreground truncate">{company.sector}</span>
          )}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        {company.trade_count > 0 && (
          <p className="text-xs font-semibold tabular-nums">{company.trade_count} trades</p>
        )}
        {company.last_trade_date && (
          <p className="text-[10px] text-muted-foreground">
            {format(new Date(company.last_trade_date), 'MMM d')}
          </p>
        )}
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-1" />
    </button>
  );
}