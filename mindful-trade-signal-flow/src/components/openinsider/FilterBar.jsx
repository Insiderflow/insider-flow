import React, { useState } from 'react';
import { Search, X, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';

const TX_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'P', label: 'Purchase' },
  { value: 'S', label: 'Sale' },
  { value: 'S+OE', label: 'Sale+OE' },
  { value: 'A', label: 'Award' },
  { value: 'G', label: 'Gift' },
];

const DATE_RANGES = [
  { value: 'all', label: 'All Time' },
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: '1y', label: '1 Year' },
];

export default function FilterBar({ filters, onChange }) {
  const [expanded, setExpanded] = useState(false);

  const update = (key, val) => onChange({ ...filters, [key]: val });

  return (
    <div className="px-4 space-y-2">
      {/* Search row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Ticker, company, owner…"
            value={filters.keyword}
            onChange={e => update('keyword', e.target.value)}
            className="pl-9 pr-8 h-9 bg-card border-border/50 text-sm"
          />
          {filters.keyword && (
            <button
              onClick={() => update('keyword', '')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
        <button
          onClick={() => setExpanded(v => !v)}
          className={`flex items-center gap-1 px-3 h-9 rounded-lg border text-xs font-semibold transition-colors flex-shrink-0 ${
            expanded || filters.type !== 'all' || filters.dateRange !== 'all'
              ? 'bg-primary/10 border-primary/30 text-primary'
              : 'bg-card border-border/50 text-muted-foreground hover:text-foreground'
          }`}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filter
          {(filters.type !== 'all' || filters.dateRange !== 'all') && (
            <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center ml-0.5">
              {(filters.type !== 'all' ? 1 : 0) + (filters.dateRange !== 'all' ? 1 : 0)}
            </span>
          )}
        </button>
      </div>

      {/* Expanded filter panel */}
      {expanded && (
        <div className="bg-card border border-border/50 rounded-xl p-3 space-y-3 animate-slide-up">
          {/* Transaction type */}
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Type</p>
            <div className="flex flex-wrap gap-1.5">
              {TX_TYPES.map(t => (
                <button
                  key={t.value}
                  onClick={() => update('type', t.value)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    filters.type === t.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date range */}
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Date Range</p>
            <div className="flex gap-1.5">
              {DATE_RANGES.map(d => (
                <button
                  key={d.value}
                  onClick={() => update('dateRange', d.value)}
                  className={`flex-1 py-1 rounded-lg text-xs font-medium transition-colors ${
                    filters.dateRange === d.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reset */}
          {(filters.type !== 'all' || filters.dateRange !== 'all') && (
            <button
              onClick={() => onChange({ ...filters, type: 'all', dateRange: 'all' })}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Reset filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}