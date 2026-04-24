import React from 'react';
import { SearchX } from 'lucide-react';

export default function EmptyState({ icon: Icon = SearchX, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-semibold mb-1">{title || 'No results'}</h3>
      <p className="text-xs text-muted-foreground max-w-[240px]">
        {description || 'Try adjusting your filters or check back later.'}
      </p>
    </div>
  );
}