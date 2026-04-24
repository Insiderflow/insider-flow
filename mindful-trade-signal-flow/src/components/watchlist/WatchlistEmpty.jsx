import React from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';

const CTA_LABELS = {
  politician: 'Search politicians',
  company:    'Search companies',
  owner:      'Search owners',
  ticker:     'Search stocks',
};

export default function WatchlistEmpty({ tab }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-4 text-2xl">
        👀
      </div>
      <h3 className="text-sm font-semibold mb-1">Nothing here yet</h3>
      <p className="text-xs text-muted-foreground max-w-[220px] mb-5">
        Track {tab}s to monitor their insider trading activity.
      </p>
      <Link
        to="/search"
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
      >
        <Search className="h-3.5 w-3.5" />
        {CTA_LABELS[tab] || 'Go to Search'}
      </Link>
    </div>
  );
}