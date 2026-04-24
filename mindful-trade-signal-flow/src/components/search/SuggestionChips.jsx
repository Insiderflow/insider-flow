import React from 'react';

export default function SuggestionChips({ suggestions, onSelect }) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="px-4 pb-2">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Suggestions</p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((s, idx) => (
          <button
            key={idx}
            onClick={() => onSelect(s.label)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary rounded-full text-xs font-medium hover:bg-secondary/70 active:scale-95 transition-all"
          >
            {s.type === 'politician' && <span>🏛</span>}
            {s.type === 'ticker' && <span className="font-mono font-bold text-primary">{s.ticker}</span>}
            {s.type === 'issuer' && <span>🏢</span>}
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}