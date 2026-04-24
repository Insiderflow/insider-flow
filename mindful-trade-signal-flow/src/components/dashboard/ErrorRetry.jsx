import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ErrorRetry({ message, onRetry }) {
  return (
    <div className="mx-4 bg-destructive/5 border border-destructive/20 rounded-xl p-5 flex flex-col items-center text-center gap-3">
      <AlertCircle className="h-7 w-7 text-destructive" />
      <div>
        <p className="text-sm font-semibold">Something went wrong</p>
        <p className="text-xs text-muted-foreground mt-1">
          {message || 'Unable to load data. Please try again.'}
        </p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-2 h-8 text-xs">
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </Button>
      )}
    </div>
  );
}