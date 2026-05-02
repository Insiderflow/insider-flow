import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getOpenInsiderTransactions, getOpenInsiderCompanies, getOpenInsiderOwners } from '@/lib/api';
import { subDays, subYears, parseISO, isAfter } from 'date-fns';
import AppHeader from '@/components/layout/AppHeader';
import FilterBar from '@/components/openinsider/FilterBar';
import SortBar from '@/components/openinsider/SortBar';
import TransactionRow from '@/components/openinsider/TransactionRow';
import CompanyRow from '@/components/openinsider/CompanyRow';
import OwnerRow from '@/components/openinsider/OwnerRow';
import ExplorerSkeleton from '@/components/openinsider/ExplorerSkeleton';
import EmptyState from '@/components/insider/EmptyState';
import { AlertCircle, RefreshCw, Database } from 'lucide-react';
import { useTranslation } from '@/lib/useTranslation';

const DEFAULT_FILTERS = { keyword: '', type: 'all', dateRange: 'all' };

function dateThreshold(range) {
  const now = new Date();
  if (range === '7d') return subDays(now, 7);
  if (range === '30d') return subDays(now, 30);
  if (range === '90d') return subDays(now, 90);
  if (range === '1y') return subYears(now, 1);
  return null;
}

function sortItems(items, sort) {
  return [...items].sort((a, b) => {
    const desc = sort.startsWith('-');
    const key = desc ? sort.slice(1) : sort;
    const av = a[key];
    const bv = b[key];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    const cmp = av < bv ? -1 : av > bv ? 1 : 0;
    return desc ? -cmp : cmp;
  });
}

export default function OpenInsiderExplorer() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const TAB_KEYS = ['transactions', 'companies', 'owners'];
  const TABS = [t('transactionsTab'), t('companiesTabOpenInsider'), t('ownersTabOpenInsider')];
  const [activeTab, setActiveTab] = useState(0);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [sort, setSort] = useState('-transaction_date');
  const [density, setDensity] = useState('comfortable');

  /* --- Data fetching --- */
  const { data: txData = [], isLoading: txLoading, error: txError, refetch: txRefetch } =
    useQuery({ queryKey: ['oi-transactions'], queryFn: () => getOpenInsiderTransactions({ limit: 100 }) });

  const { data: companies = [], isLoading: coLoading, error: coError, refetch: coRefetch } =
    useQuery({ queryKey: ['oi-companies'], queryFn: () => getOpenInsiderCompanies({ limit: 100 }) });

  const { data: owners = [], isLoading: owLoading, error: owError, refetch: owRefetch } =
    useQuery({ queryKey: ['oi-owners'], queryFn: () => getOpenInsiderOwners({ limit: 100 }) });

  /* --- Filtering + sorting for transactions --- */
  const filteredTx = useMemo(() => {
    const kw = filters.keyword.toLowerCase();
    const threshold = dateThreshold(filters.dateRange);
    let result = txData.filter(tx => {
      if (kw && !(
        tx.ticker?.toLowerCase().includes(kw) ||
        tx.company_name?.toLowerCase().includes(kw) ||
        tx.owner_name?.toLowerCase().includes(kw)
      )) return false;
      if (filters.type !== 'all' && tx.transaction_type !== filters.type) return false;
      if (threshold && tx.transaction_date) {
        try { if (!isAfter(parseISO(tx.transaction_date), threshold)) return false; } catch {}
      }
      return true;
    });
    return sortItems(result, sort);
  }, [txData, filters, sort]);

  const filteredCompanies = useMemo(() => {
    const kw = filters.keyword.toLowerCase();
    return companies.filter(c =>
      !kw || c.ticker?.toLowerCase().includes(kw) || c.company_name?.toLowerCase().includes(kw)
    );
  }, [companies, filters.keyword]);

  const filteredOwners = useMemo(() => {
    const kw = filters.keyword.toLowerCase();
    return owners.filter(o =>
      !kw || o.owner_name?.toLowerCase().includes(kw) || o.company_name?.toLowerCase().includes(kw)
    );
  }, [owners, filters.keyword]);

  /* --- Tab state helpers --- */
  const tabIsLoading = [txLoading, coLoading, owLoading][activeTab];
  const tabError = [txError, coError, owError][activeTab];
  const tabRefetch = [txRefetch, coRefetch, owRefetch][activeTab];
  const tabCount = [filteredTx.length, filteredCompanies.length, filteredOwners.length][activeTab];

  /* --- Error state --- */
  function ErrorState() {
    return (
      <div className="px-4 mt-8 flex flex-col items-center gap-3 text-center">
        <AlertCircle className="h-7 w-7 text-muted-foreground" />
        <div>
          <p className="text-sm font-semibold">{t('failedLoadData')}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{t('filtersPreserved')}</p>
        </div>
        <button
          onClick={() => tabRefetch()}
          className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80"
        >
          <RefreshCw className="h-3.5 w-3.5" /> {t('retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <AppHeader title="OpenInsider" showSearch={false} />

      {/* Tab bar */}
      <div className="sticky top-14 z-30 bg-background/85 backdrop-blur-xl border-b border-border/50">
        <div className="flex px-4 gap-1 pt-2 pb-0">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`relative flex-1 pb-2 text-sm font-semibold transition-colors ${
                activeTab === i ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
              {activeTab === i && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-8 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Filter bar — shown on all tabs */}
      <div className="pt-4 pb-2 space-y-3">
        <FilterBar filters={filters} onChange={setFilters} />

        {/* Sort bar — only on transactions tab */}
        {activeTab === 0 && (
          <SortBar
            sort={sort}
            onSort={setSort}
            density={density}
            onDensity={setDensity}
            count={tabCount}
          />
        )}

        {activeTab !== 0 && (
          <div className="px-4">
            <p className="text-xs text-muted-foreground">{tabCount} {t('results')}</p>
          </div>
        )}
      </div>

      {/* Content */}
      <div className={`space-y-${density === 'compact' ? '1.5' : '2.5'} px-4`}>
        {tabIsLoading ? (
          <ExplorerSkeleton tab={TAB_KEYS[activeTab]} density={density} />
        ) : tabError ? (
          <ErrorState />
        ) : activeTab === 0 ? (
          filteredTx.length === 0 ? (
            <EmptyState icon={Database} title={t('noTransactions')} description={t('tryAdjustFilters')} />
          ) : (
            filteredTx.map((tx, i) => (
              <TransactionRow
                key={tx.id || i}
                tx={tx}
                density={density}
                onCompanyClick={() => navigate(`/issuer?ticker=${encodeURIComponent(tx.ticker)}`)}
                onOwnerClick={() => navigate(`/owner?name=${encodeURIComponent(tx.owner_name)}`)}
              />
            ))
          )
        ) : activeTab === 1 ? (
          filteredCompanies.length === 0 ? (
            <EmptyState icon={Database} title={t('noCompanies')} description={t('tryDifferentSearch')} />
          ) : (
            filteredCompanies.map((c, i) => (
              <CompanyRow
                key={c.id || i}
                company={c}
                onClick={() => navigate(`/issuer?ticker=${encodeURIComponent(c.ticker)}`)}
              />
            ))
          )
        ) : (
          filteredOwners.length === 0 ? (
            <EmptyState icon={Database} title={t('noOwners')} description={t('tryDifferentSearch')} />
          ) : (
            filteredOwners.map((o, i) => (
              <OwnerRow
                key={o.id || i}
                owner={o}
                onClick={() => navigate(`/owner?name=${encodeURIComponent(o.owner_name)}`)}
              />
            ))
          )
        )}
      </div>
    </div>
  );
}