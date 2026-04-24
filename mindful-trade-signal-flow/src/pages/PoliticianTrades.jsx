import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getPoliticianTrades } from '@/lib/api';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import AppHeader from '@/components/layout/AppHeader';
import ChipFilter from '@/components/insider/ChipFilter';
import TradeCard from '@/components/insider/TradeCard';
import SkeletonTradeCard from '@/components/insider/SkeletonTradeCard';
import EmptyState from '@/components/insider/EmptyState';

const partyOptions = [
  { value: 'Democrat', label: 'Democrat' },
  { value: 'Republican', label: 'Republican' },
  { value: 'Independent', label: 'Independent' },
];

const typeOptions = [
  { value: 'Buy', label: 'Buys' },
  { value: 'Sell', label: 'Sells' },
];

export default function PoliticianTrades() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [partyFilter, setPartyFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const { data: trades = [], isLoading } = useQuery({
    queryKey: ['politician-trades'],
    queryFn: () => getPoliticianTrades({ limit: 50 }),
  });

  const filtered = useMemo(() => {
    return trades.filter(t => {
      const matchesSearch = !search ||
        t.politician_name?.toLowerCase().includes(search.toLowerCase()) ||
        t.ticker?.toLowerCase().includes(search.toLowerCase()) ||
        t.company_name?.toLowerCase().includes(search.toLowerCase());
      const matchesParty = partyFilter === 'all' || t.party === partyFilter;
      const matchesType = typeFilter === 'all' || t.trade_type === typeFilter;
      return matchesSearch && matchesParty && matchesType;
    });
  }, [trades, search, partyFilter, typeFilter]);

  return (
    <div className="min-h-screen">
      <AppHeader title="Politicians" showSearch onSearchClick={() => setShowSearch(!showSearch)} />

      <div className="px-4 py-4 space-y-4">
        {/* Search bar */}
        {showSearch && (
          <div className="relative animate-slide-up">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search politician, ticker, company..."
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

        {/* Filters */}
        <div className="space-y-2">
          <ChipFilter options={partyOptions} value={partyFilter} onChange={setPartyFilter} allLabel="All Parties" />
          <ChipFilter options={typeOptions} value={typeFilter} onChange={setTypeFilter} allLabel="Buy & Sell" />
        </div>

        {/* Results count */}
        <p className="text-xs text-muted-foreground">{filtered.length} trades</p>

        {/* Trade list */}
        <div className="space-y-3">
          {isLoading ? (
            Array(6).fill(0).map((_, i) => <SkeletonTradeCard key={i} />)
          ) : filtered.length === 0 ? (
            <EmptyState title="No politician trades" description="Adjust your search or filters." />
          ) : (
            filtered.map((trade) => (
              <TradeCard
                key={trade.id}
                trade={trade}
                type="politician"
                onClick={() => navigate(`/politician?name=${encodeURIComponent(trade.politician_name)}`)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}