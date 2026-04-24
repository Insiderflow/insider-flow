import React from 'react';
import { Search, Landmark, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const actions = [
  {
    icon: Search,
    label: 'Search',
    description: 'Find any trade',
    to: '/search',
    color: 'bg-primary/10 text-primary',
  },
  {
    icon: Landmark,
    label: 'Politicians',
    description: 'Track by member',
    to: '/politicians',
    color: 'bg-purple-500/10 text-purple-400',
  },
  {
    icon: TrendingUp,
    label: 'Track Stock',
    description: 'Add to watchlist',
    to: '/watchlist',
    color: 'bg-buy/10 text-buy',
  },
];

export default function QuickActions() {
  return (
    <div className="px-4 space-y-3">
      <h2 className="text-sm font-semibold">Quick Actions</h2>
      <div className="grid grid-cols-3 gap-2">
        {actions.map(({ icon: Icon, label, description, to, color }) => (
          <Link
            key={label}
            to={to}
            className="bg-card border border-border/50 rounded-xl p-3 flex flex-col items-center gap-2 hover:border-border active:scale-[0.97] transition-all text-center"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold leading-tight">{label}</p>
              <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}