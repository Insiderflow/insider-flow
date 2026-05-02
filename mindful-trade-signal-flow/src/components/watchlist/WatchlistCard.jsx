import React from 'react';
import { Trash2, CheckCircle2, Circle } from 'lucide-react';
import { useTranslation } from '@/lib/useTranslation';

const TYPE_META = {
  politician: { emoji: '🏛️', label: 'Politician', color: 'bg-blue-500/10' },
  company:    { emoji: '🏢', label: 'Company',    color: 'bg-primary/10' },
  owner:      { emoji: '👤', label: 'Owner',      color: 'bg-purple-500/10' },
  ticker:     { emoji: '📈', label: 'Stock',      color: 'bg-buy/10' },
  insider:    { emoji: '👤', label: 'Insider',    color: 'bg-purple-500/10' },
};

export default function WatchlistCard({ item, bulkMode, selected, onSelect, onRemove, onOpen, removing }) {
  const meta = TYPE_META[item.type] || { emoji: '📌', label: item.type, color: 'bg-secondary' };
  const { t, displaySector } = useTranslation();
  const isPolitician = item.type === 'politician';
  const initials = item.label ? item.label.split(' ').map((n) => n[0]).slice(0, 2).join('') : '?';

  return (
    <div
      onClick={() => {
        if (bulkMode || removing) return;
        onOpen?.(item);
      }}
      className={`bg-card rounded-xl border transition-all duration-150 ${
        removing ? 'opacity-40 scale-[0.98]' : 'opacity-100'
      } ${selected ? 'border-primary/60' : 'border-border/50'} ${
        bulkMode || removing ? '' : 'cursor-pointer hover:border-border'
      }`}
    >
      <div className="flex items-center gap-3 px-4 py-3.5">
        {/* Bulk select or avatar */}
        {bulkMode ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(item.id);
            }}
            className="flex-shrink-0"
          >
            {selected
              ? <CheckCircle2 className="h-5 w-5 text-primary" />
              : <Circle className="h-5 w-5 text-muted-foreground" />
            }
          </button>
        ) : (
          <div className={`w-10 h-10 rounded-xl overflow-hidden ${meta.color} flex items-center justify-center text-lg flex-shrink-0`}>
            {isPolitician && item.avatar_url ? (
              <img src={item.avatar_url} alt={item.label} className="w-full h-full object-cover" />
            ) : isPolitician ? (
              <span className="text-[11px] font-bold text-muted-foreground">{initials}</span>
            ) : (
              meta.emoji
            )}
          </div>
        )}

        {/* Identity */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{item.label}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
            {isPolitician
              ? `${t('sector')}: ${displaySector(item.sector) || t('unknown')}`
              : meta.label}
          </p>
          {item.notes && (
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate italic">{item.notes}</p>
          )}
        </div>

        {/* Remove button (hidden in bulk mode) */}
        {!bulkMode && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(item);
            }}
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