import React from 'react';

export default function StatTile({ label, value, change, icon: Icon, accent }) {
  const accentMap = {
    buy: 'text-buy',
    sell: 'text-sell',
    primary: 'text-primary',
    warning: 'text-warning-color',
    neutral: 'text-muted-foreground',
  };

  return (
    <div className="bg-card rounded-xl p-4 border border-border/50 flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-2">
        {Icon && <Icon className={`h-4 w-4 ${accentMap[accent] || 'text-muted-foreground'}`} />}
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider truncate">
          {label}
        </span>
      </div>
      <p className="text-xl font-bold tabular-nums">{value}</p>
      {change && (
        <p className={`text-xs font-medium mt-1 ${
          change.startsWith('+') ? 'text-buy' : change.startsWith('-') ? 'text-sell' : 'text-muted-foreground'
        }`}>
          {change}
        </p>
      )}
    </div>
  );
}