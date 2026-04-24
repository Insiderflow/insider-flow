import React from 'react';
import { ArrowUpDown, LayoutList, AlignJustify } from 'lucide-react';

const SORT_OPTIONS = [
  { value: '-transaction_date', label: 'Newest' },
  { value: 'transaction_date', label: 'Oldest' },
  { value: '-value_numeric', label: 'Value ↓' },
  { value: 'value_numeric', label: 'Value ↑' },
];

export default function SortBar({ sort, onSort, density, onDensity, count }) {
  return (
    <div className="px-4 flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5">
        <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => onSort(opt.value)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap flex-shrink-0 transition-colors ${
                sort === opt.value
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        <span className="text-[11px] text-muted-foreground tabular-nums">{count}</span>
        <button
          onClick={() => onDensity(density === 'comfortable' ? 'compact' : 'comfortable')}
          className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          title={density === 'comfortable' ? 'Switch to compact' : 'Switch to comfortable'}
        >
          {density === 'comfortable'
            ? <AlignJustify className="h-3.5 w-3.5" />
            : <LayoutList className="h-3.5 w-3.5" />
          }
        </button>
      </div>
    </div>
  );
}