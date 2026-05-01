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
import { useTranslation } from '@/lib/useTranslation';
import PaidOnlyGate from '@/components/billing/PaidOnlyGate';

const partyOptions = [
  { value: 'Democrat', label: 'Democrat' },
  { value: 'Republican', label: 'Republican' },
  { value: 'Independent', label: 'Independent' },
];

const typeOptions = [
  { value: 'Buy', label: 'Buys' },
  { value: 'Sell', label: 'Sells' },
];

const sectorOptions = [
  'Information Technology',
  'Financials',
  'Industrials',
  'Health Care',
  'Consumer Discretionary',
  'Communication Services',
  'Consumer Staples',
  'Energy',
  'Materials',
  'Real Estate',
  'Utilities',
];

function normalizeSectorValue(value) {
  return String(value || '').replace(/\s+/g, '').toLowerCase();
}

function inferSeatSectorFromCommittees(committees) {
  const raw = String(committees || '').toLowerCase();
  if (!raw) return null;

  const rules = [
    { sector: 'Information Technology', keywords: ['science', 'technology', 'cyber', 'innovation'] },
    { sector: 'Financials', keywords: ['finance', 'financial services', 'banking', 'ways and means'] },
    { sector: 'Industrials', keywords: ['transportation', 'infrastructure', 'commerce', 'public works'] },
    { sector: 'Health Care', keywords: ['health', 'healthcare', 'public health'] },
    { sector: 'Consumer Discretionary', keywords: ['small business', 'tourism'] },
    { sector: 'Communication Services', keywords: ['intelligence', 'communications', 'telecommunications'] },
    { sector: 'Consumer Staples', keywords: ['agriculture', 'food'] },
    { sector: 'Energy', keywords: ['energy', 'natural resources'] },
    { sector: 'Materials', keywords: ['natural resources', 'environment', 'mining'] },
    { sector: 'Real Estate', keywords: ['housing', 'urban affairs', 'real estate'] },
    { sector: 'Utilities', keywords: ['energy and commerce', 'public works', 'infrastructure'] },
  ];

  for (const rule of rules) {
    if (rule.keywords.some((kw) => raw.includes(kw))) return rule.sector;
  }
  return null;
}

export default function PoliticianTrades() {
  const { t } = useTranslation();
  return (
    <PaidOnlyGate headerTitle={t('politiciansSegment')}>
      <PoliticianTradesContent />
    </PaidOnlyGate>
  );
}

function PoliticianTradesContent() {
  const navigate = useNavigate();
  const { t, displayParty, displaySector } = useTranslation();
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [partyFilter, setPartyFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sectorFilter, setSectorFilter] = useState('all');

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
      const seatSector = inferSeatSectorFromCommittees(t.committees);
      const filterSector = seatSector || t.sector;
      const matchesSector =
        sectorFilter === 'all' ||
        normalizeSectorValue(filterSector) === normalizeSectorValue(sectorFilter);
      return matchesSearch && matchesParty && matchesType && matchesSector;
    });
  }, [trades, search, partyFilter, typeFilter, sectorFilter]);

  return (
    <div className="min-h-screen">
      <AppHeader title="Politicians" showSearch onSearchClick={() => setShowSearch(!showSearch)} />

      <div className="px-4 py-4 space-y-4">
        {/* Search bar */}
        {showSearch && (
          <div className="relative animate-slide-up">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('searchPlaceholder')}
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
        <div className="space-y-2 rounded-2xl border border-border/50 bg-card/60 p-3">
          <ChipFilter
            options={partyOptions.map((o) => ({ ...o, label: displayParty(o.label) || o.label }))}
            value={partyFilter}
            onChange={setPartyFilter}
            allLabel={t('all')}
          />
          <ChipFilter options={typeOptions} value={typeFilter} onChange={setTypeFilter} allLabel="Buy & Sell" />
          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            className="w-full h-10 rounded-xl bg-background border border-border/50 px-3 text-sm text-foreground outline-none"
          >
            <option value="all">{t('all')} {t('sector')}</option>
            {sectorOptions.map((sector) => (
              <option key={sector} value={sector}>
                {displaySector(sector)}
              </option>
            ))}
          </select>
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{filtered.length} {t('totalTrades')}</p>
          {(search || partyFilter !== 'all' || typeFilter !== 'all' || sectorFilter !== 'all') && (
            <button
              onClick={() => {
                setSearch('');
                setPartyFilter('all');
                setTypeFilter('all');
                setSectorFilter('all');
              }}
              className="text-[11px] text-primary font-medium active:opacity-70"
            >
              {t('clear')}
            </button>
          )}
        </div>

        {/* Trade list */}
        <div className="space-y-3.5">
          {isLoading ? (
            Array(6).fill(0).map((_, i) => <SkeletonTradeCard key={i} />)
          ) : filtered.length === 0 ? (
            <EmptyState title={t('noPoliticianTrades')} description={t('adjustSearchOrFilters')} />
          ) : (
            filtered.map((trade, idx) => (
              <div
                key={trade.id}
                className="motion-stagger-item"
                style={{ '--stagger-delay': `${Math.min(idx, 11) * 30}ms` }}
              >
                <TradeCard
                  trade={trade}
                  type="politician"
                  subtitleMode="sector"
                  subtitleSector={inferSeatSectorFromCommittees(trade.committees) || trade.sector}
                  onClick={() => navigate(`/politician?name=${encodeURIComponent(trade.politician_name)}`)}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}