import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import AppHeader from '@/components/layout/AppHeader';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import EmptyState from '@/components/insider/EmptyState';
import { getCorporateTrades, getPoliticianTrades } from '@/lib/api';
import { useTranslation } from '@/lib/useTranslation';
import PaidOnlyGate from '@/components/billing/PaidOnlyGate';

function toIso(d) {
  if (!d) return '';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

export default function Issuers() {
  const { t } = useTranslation();
  return (
    <PaidOnlyGate headerTitle={t('issuers')}>
      <IssuersContent />
    </PaidOnlyGate>
  );
}

function IssuersContent() {
  const navigate = useNavigate();
  const { t, displaySector, displayIssuerName } = useTranslation();
  const [search, setSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [rankBy, setRankBy] = useState('Buy');

  const { data = [], isLoading } = useQuery({
    queryKey: ['issuers-ranking'],
    queryFn: async () => {
      const [pTrades, cTrades] = await Promise.all([
        getPoliticianTrades({ limit: 400 }),
        getCorporateTrades({ limit: 400 }),
      ]);
      return [...(pTrades || []), ...(cTrades || [])];
    },
  });

  const issuers = useMemo(() => {
    const map = new Map();
    for (const trade of data) {
      const ticker = String(trade.ticker || '').toUpperCase();
      if (!ticker) continue;
      const key = ticker;
      if (!map.has(key)) {
        map.set(key, {
          ticker,
          company_name: trade.company_name || ticker,
          sector: trade.sector || '',
          buyCount: 0,
          sellCount: 0,
          totalCount: 0,
          lastTradeDate: '',
        });
      }
      const row = map.get(key);
      row.totalCount += 1;
      if (trade.trade_type === 'Sell') row.sellCount += 1;
      else row.buyCount += 1;
      const d = toIso(trade.trade_date || trade.filing_date);
      if (d && (!row.lastTradeDate || d > row.lastTradeDate)) row.lastTradeDate = d;
      if (!row.sector && trade.sector) row.sector = trade.sector;
    }
    return Array.from(map.values());
  }, [data]);

  const sectorOptions = useMemo(() => {
    const set = new Set();
    for (const i of issuers) {
      if (i.sector) set.add(i.sector);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [issuers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = issuers.filter((i) => {
      const matchesSearch =
        !q ||
        i.ticker.toLowerCase().includes(q) ||
        i.company_name.toLowerCase().includes(q);
      const matchesSector = sectorFilter === 'all' || i.sector === sectorFilter;
      return matchesSearch && matchesSector;
    });
    return rows.sort((a, b) => {
      const aRank = rankBy === 'Sell' ? a.sellCount : a.buyCount;
      const bRank = rankBy === 'Sell' ? b.sellCount : b.buyCount;
      if (bRank !== aRank) return bRank - aRank;
      return b.totalCount - a.totalCount;
    });
  }, [issuers, search, sectorFilter, rankBy]);

  return (
    <div className="min-h-screen">
      <AppHeader title="Issuers" />
      <div className="px-4 py-4 space-y-4">
        <Input
          placeholder={t('searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 bg-card border-border/50"
        />

        <div className="grid grid-cols-2 gap-2">
          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            className="h-10 rounded-xl bg-card border border-border/50 px-3 text-sm text-foreground outline-none"
          >
            <option value="all">{t('all')} {t('sector')}</option>
            {sectorOptions.map((s) => (
              <option key={s} value={s}>{displaySector(s)}</option>
            ))}
          </select>
          <select
            value={rankBy}
            onChange={(e) => setRankBy(e.target.value)}
            className="h-10 rounded-xl bg-card border border-border/50 px-3 text-sm text-foreground outline-none"
          >
            <option value="Buy">{t('buy')}</option>
            <option value="Sell">{t('sell')}</option>
          </select>
        </div>

        <p className="text-xs text-muted-foreground">{filtered.length} {t('results')}</p>

        <div className="space-y-2">
          {isLoading ? (
            Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)
          ) : filtered.length === 0 ? (
            <EmptyState title={t('noCompanies')} description={t('adjustSearchOrFilters')} />
          ) : (
            filtered.map((issuer) => (
              <button
                key={issuer.ticker}
                type="button"
                onClick={() => navigate(`/issuer?ticker=${encodeURIComponent(issuer.ticker)}`)}
                className="w-full text-left bg-card rounded-xl border border-border/50 p-3 hover:border-border transition-all active:scale-[0.99]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {displayIssuerName(issuer.company_name, issuer.ticker)}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {issuer.ticker} · {t('sector')}: {displaySector(issuer.sector) || t('unknown')}
                    </p>
                  </div>
                  <div className="text-right text-xs">
                    <p className="text-buy">{t('buy')}: {issuer.buyCount}</p>
                    <p className="text-sell">{t('sell')}: {issuer.sellCount}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

