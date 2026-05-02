import React from 'react';
import { Search, Landmark, TrendingUp, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from '@/lib/useTranslation';

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
  {
    icon: Building2,
    label: 'Issuers',
    description: 'Filter by sector',
    to: '/issuers',
    color: 'bg-primary/10 text-primary',
  },
];

export default function QuickActions() {
  const { t } = useTranslation();
  return (
    <div className="px-4 space-y-3">
      <h2 className="text-ui-section">{t('quickActions')}</h2>
      <div className="grid grid-cols-2 gap-2 motion-fade-in">
        {actions.map(({ icon: Icon, label, description, to, color }) => (
          <Link
            key={label}
            to={to}
            className="bg-card border border-border/50 rounded-xl p-3 flex flex-col items-center gap-2 hover:border-border transition-all text-center min-h-[116px] motion-press motion-elevate"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold leading-tight tracking-tight">
                {label === 'Search'
                  ? t('navSearch')
                  : label === 'Politicians'
                    ? t('politiciansSegment')
                    : label === 'Issuers'
                      ? t('issuers')
                      : t('quickTrackStock')}
              </p>
              <p className="text-ui-caption leading-tight mt-0.5">
                {description === 'Find any trade'
                  ? t('quickSearchDesc')
                  : description === 'Track by member'
                    ? t('quickPoliticiansDesc')
                    : description === 'Filter by sector'
                      ? `${t('sector')} / ${t('buy')}-${t('sell')}`
                    : t('quickTrackStockDesc')}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}