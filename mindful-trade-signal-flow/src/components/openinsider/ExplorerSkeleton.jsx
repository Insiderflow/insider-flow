import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

function TxSkeleton({ compact }) {
  return (
    <div className={`bg-card rounded-xl border border-border/50 ${compact ? 'px-3 py-2.5' : 'px-4 py-3.5'} space-y-2`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="w-5 h-5 rounded-full" />
        <Skeleton className="h-3 w-32" />
      </div>
      <div className="flex items-center justify-between pt-1 border-t border-border/30">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

function RowSkeleton() {
  return (
    <div className="bg-card rounded-xl border border-border/50 px-4 py-3.5 flex items-center gap-3">
      <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-36" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-3 w-14" />
    </div>
  );
}

export default function ExplorerSkeleton({ tab = 'transactions', density = 'comfortable' }) {
  const count = 7;
  return (
    <div className="px-4 space-y-2.5">
      {Array(count).fill(0).map((_, i) =>
        tab === 'transactions'
          ? <TxSkeleton key={i} compact={density === 'compact'} />
          : <RowSkeleton key={i} />
      )}
    </div>
  );
}