import React from 'react';
import { Trash2, X } from 'lucide-react';

export default function BulkActionBar({ count, total, onSelectAll, onClearAll, onDeleteSelected, isDeleting }) {
  return (
    <div className="fixed bottom-20 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-sm bg-card border border-border rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3 animate-slide-up">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">{count} selected</p>
          <div className="flex gap-2 mt-0.5">
            <button
              onClick={onSelectAll}
              className="text-[11px] text-primary font-medium hover:underline"
            >
              Select all ({total})
            </button>
            <span className="text-[11px] text-muted-foreground">·</span>
            <button
              onClick={onClearAll}
              className="text-[11px] text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          </div>
        </div>
        <button
          onClick={onDeleteSelected}
          disabled={count === 0 || isDeleting}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sell text-sell-foreground text-xs font-semibold disabled:opacity-50 hover:bg-sell/90 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
          {isDeleting ? 'Removing…' : 'Remove'}
        </button>
      </div>
    </div>
  );
}