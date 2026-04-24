import React from 'react';
import { Trash2, CheckCircle2, Circle } from 'lucide-react';

const TYPE_META = {
  politician: { emoji: '🏛️', label: 'Politician', color: 'bg-blue-500/10' },
  company:    { emoji: '🏢', label: 'Company',    color: 'bg-primary/10' },
  owner:      { emoji: '👤', label: 'Owner',      color: 'bg-purple-500/10' },
  ticker:     { emoji: '📈', label: 'Stock',      color: 'bg-buy/10' },
  insider:    { emoji: '👤', label: 'Insider',    color: 'bg-purple-500/10' },
};

export default function WatchlistCard({ item, bulkMode, selected, onSelect, onRemove, removing }) {
  const meta = TYPE_META[item.type] || { emoji: '📌', label: item.type, color: 'bg-secondary' };

  return (
    <div
      className={`bg-card rounded-xl border transition-all duration-150 ${
        removing ? 'opacity-40 scale-[0.98]' : 'opacity-100'
      } ${selected ? 'border-primary/60' : 'border-border/50'}`}
    >
      <div className="flex items-center gap-3 px-4 py-3.5">
        {/* Bulk select or avatar */}
        {bulkMode ? (
          <button onClick={() => onSelect(item.id)} className="flex-shrink-0">
            {selected
              ? <CheckCircle2 className="h-5 w-5 text-primary" />
              : <Circle className="h-5 w-5 text-muted-foreground" />
            }
          </button>
        ) : (
          <div className={`w-10 h-10 rounded-xl ${meta.color} flex items-center justify-center text-lg flex-shrink-0`}>
            {meta.emoji}
          </div>
        )}

        {/* Identity */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{item.label}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[11px] text-muted-foreground capitalize">{meta.label}</span>
            {item.identifier && item.identifier !== item.label && (
              <span className="text-[11px] font-mono text-muted-foreground/70 truncate">· {item.identifier}</span>
            )}
          </div>
          {item.notes && (
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate italic">{item.notes}</p>
          )}
        </div>

        {/* Remove button (hidden in bulk mode) */}
        {!bulkMode && (
          <button
            onClick={() => onRemove(item)}
            disabled={removing}
            className="flex-shrink-0 p-2 rounded-lg text-muted-foreground hover:text-sell hover:bg-sell/10 transition-colors disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}