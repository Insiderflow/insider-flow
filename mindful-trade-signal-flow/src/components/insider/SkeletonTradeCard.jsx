import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function SkeletonTradeCard() {
  return (
    <div className="bg-card rounded-xl border border-border/50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-3 w-48" />
        </div>
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
        <Skeleton className="h-4 w-16" />
        <div className="text-right">
          <Skeleton className="h-3 w-20 mb-1" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
}