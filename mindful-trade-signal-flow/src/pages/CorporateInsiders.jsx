import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getCorporateTrades } from '@/lib/api';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import AppHeader from '@/components/layout/AppHeader';
import ChipFilter from '@/components/insider/ChipFilter';
import TradeCard from '@/components/insider/TradeCard';
import SkeletonTradeCard from '@/components/insider/SkeletonTradeCard';
import EmptyState from '@/components/insider/EmptyState';
import { useTranslation } from '@/lib/useTranslation';

const typeOptions = [
  { value: 'Buy', label: 'Buys' },
  { value: 'Sell', label: 'Sells' },
];

export default function CorporateInsiders() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');

  const { data: trades = [], isLoading } = useQuery({
    queryKey: ['corporate-trades'],
    queryFn: () => getCorporateTrades({ limit: 50 }),
  });

  const filtered = useMemo(() => {
    return trades.filter(t => {
      const matchesSearch = !search ||
        t.insider_name?.toLowerCase().includes(search.toLowerCase()) ||
        t.ticker?.toLowerCase().includes(search.toLowerCase()) ||
        t.company_name?.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === 'all' || t.trade_type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [trades, search, typeFilter]);

  return (
    <div className="min-h-screen">
      <AppHeader title="Corporate" showSearch onSearchClick={() => setShowSearch(!showSearch)} />

      <div className="px-4 py-4 space-y-4">
        {showSearch && (
          <div className="relative animate-slide-up">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('searchInsiderPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-9 h-10 bg-card border-border/50"
              autoFocus
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
        )}

        <ChipFilter options={typeOptions} value={typeFilter} onChange={setTypeFilter} allLabel="Buy & Sell" />

        <p className="text-xs text-muted-foreground">{filtered.length} {t('totalTrades')}</p>

        <div className="space-y-3">
          {isLoading ? (
            Array(6).fill(0).map((_, i) => <SkeletonTradeCard key={i} />)
          ) : filtered.length === 0 ? (
            <EmptyState title={t('noCorporateTrades')} description={t('adjustSearchOrFilters')} />
          ) : (
            filtered.map((trade) => (
              <TradeCard
                key={trade.id}
                trade={trade}
                type="corporate"
                onClick={() => navigate(`/issuer?ticker=${encodeURIComponent(trade.ticker)}`)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}