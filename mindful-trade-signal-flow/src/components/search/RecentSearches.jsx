import React from 'react';
import { Clock, X, TrendingUp } from 'lucide-react';

export default function RecentSearches({ recents, onSelect, onRemove, onClearAll }) {
  if (!recents || recents.length === 0) {
    return (
      <div className="px-4 pt-6 flex flex-col items-center gap-3 text-center">
        <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center">
          <TrendingUp className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-semibold">Search Insider Flow</p>
        <p className="text-xs text-muted-foreground max-w-[220px]">
          Look up politicians, stock tickers, or company names to find insider trades.
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 space-y-2 pt-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recent</span>
        <button onClick={onClearAll} className="text-xs text-primary font-medium">Clear all</button>
      </div>
      {recents.map((item, idx) => (
        <button
          key={idx}
          onClick={() => onSelect(item)}
          className="w-full flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-secondary/60 transition-colors group text-left"
        >
          <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="flex-1 text-sm truncate">{item}</span>
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(idx); }}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </button>
      ))}
    </div>
  );
}