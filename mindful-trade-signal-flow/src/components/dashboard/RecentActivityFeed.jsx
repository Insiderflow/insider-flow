import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import SkeletonTradeCard from '@/components/insider/SkeletonTradeCard';
import SegmentedControl from '@/components/insider/SegmentedControl';
import { useTranslation } from '@/lib/useTranslation';
import { format } from 'date-fns';
import TradeBadge from '@/components/insider/TradeBadge';

function HomeRecentTradeCard({ trade, type = 'politician' }) {
  const { t, displaySector, displayIssuerName } = useTranslation();
  const [imageError, setImageError] = useState(false);
  const isPolitician = type === 'politician';
  const name = isPolitician ? trade.politician_name : trade.insider_name;
  const amount = isPolitician
    ? trade.amount_range
    : trade.total_value
      ? `$${Number(trade.total_value).toLocaleString()}`
      : '';
  const tradeDate = trade.trade_date ? format(new Date(trade.trade_date), 'yyyy/M/d') : '—';
  const discloseDate = trade.disclosure_date ? format(new Date(trade.disclosure_date), 'yyyy/M/d') : '—';
  const sectorText = displaySector(trade.sector) || '—';

  return (
    <div className="w-full text-left bg-card rounded-2xl border border-border/50 shadow-sm p-4 motion-slide-up">
      <div className="flex items-start justify-between gap-3">
        <div className="text-[11px] leading-5 text-muted-foreground">
          <div>{t('tradeDate')}: {tradeDate}</div>
          <div>{t('disclosureDate')}: {discloseDate}</div>
        </div>
        <TradeBadge type={trade.trade_type} />
      </div>

      <div className="flex items-center gap-3 mt-3.5">
        <div className="w-11 h-11 rounded-full overflow-hidden bg-secondary border border-border/50 flex items-center justify-center flex-shrink-0">
          {trade.avatar_url && !imageError ? (
            <img
              src={trade.avatar_url}
              alt={name}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <span className="text-sm font-bold text-muted-foreground">
              {name ? name.split(' ').map((n) => n[0]).slice(0, 2).join('') : '?'}
            </span>
          )}
        </div>
        <div className="min-w-0">
          {isPolitician ? (
            <Link
              to={`/politician?name=${encodeURIComponent(name)}&sector=${encodeURIComponent(trade.sector || '')}`}
              className="text-sm font-bold truncate block hover:underline active:opacity-70 motion-press"
            >
              {name}
            </Link>
          ) : (
            <p className="text-sm font-bold truncate">{name}</p>
          )}
          <p className="text-xs text-muted-foreground truncate">
            {t('sector')}: {sectorText}
          </p>
        </div>
      </div>

      <div className="mt-3.5 pt-3 border-t border-border/40 grid grid-cols-[82px_1fr] gap-y-2 gap-x-3 items-center text-sm">
        <p className="text-[12px] text-muted-foreground">{t('issuer')}</p>
        {trade.ticker ? (
          <Link
            to={`/issuer?ticker=${encodeURIComponent(trade.ticker)}`}
            className="text-primary underline truncate active:opacity-70 motion-press"
          >
            {displayIssuerName(trade.company_name || trade.ticker, trade.ticker)}
          </Link>
        ) : (
          <p className="text-primary truncate">{displayIssuerName(trade.company_name, trade.ticker) || '—'}</p>
        )}
        <p className="text-[12px] text-muted-foreground">{t('transactionSize')}</p>
        <p className="tabular-nums font-medium">{amount || '—'}</p>
      </div>
    </div>
  );
}

export default function RecentActivityFeed({ politicianTrades, corporateTrades, isLoading }) {
  const { t } = useTranslation();
  const [activeSegment, setActiveSegment] = React.useState('politician');
  const [expandTodayRange, setExpandTodayRange] = useState(false);
  const INITIAL_VISIBLE = 5;
  const SEGMENTS = [
    { label: t('politiciansSegment'), value: 'politician' },
    { label: t('corporate'), value: 'corporate' },
  ];

  const trades = activeSegment === 'politician' ? politicianTrades : corporateTrades;
  const linkTo = activeSegment === 'politician' ? '/politicians' : '/corporate';
  const todayKey = new Date().toISOString().slice(0, 10);
  const todayRangeTrades = useMemo(
    () => (trades || []).filter((trade) => {
      const tradeDate = String(trade.trade_date || '').slice(0, 10);
      const disclosureDate = String(trade.disclosure_date || '').slice(0, 10);
      return tradeDate === todayKey || disclosureDate === todayKey;
    }),
    [trades, todayKey],
  );
  const visibleTrades = expandTodayRange
    ? todayRangeTrades
    : (trades || []).slice(0, INITIAL_VISIBLE);
  const canExpandTodayRange = todayRangeTrades.length > INITIAL_VISIBLE;

  useEffect(() => {
    setExpandTodayRange(false);
  }, [activeSegment]);

  return (
    <div className="px-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-tight">{t('recentTrades')}</h2>
        <Link to={linkTo} className="flex items-center gap-0.5 text-xs text-primary font-medium motion-press">
          {t('seeAll')} <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <SegmentedControl
        options={SEGMENTS}
        value={activeSegment}
        onChange={setActiveSegment}
      />
      <div className="space-y-2.5">
        {isLoading ? (
          <>
            <SkeletonTradeCard />
            <SkeletonTradeCard />
            <SkeletonTradeCard />
          </>
        ) : visibleTrades.map((trade, idx) => (
          <div
            key={trade.id}
            className="motion-stagger-item"
            style={{ '--stagger-delay': `${Math.min(idx, 7) * 45}ms` }}
          >
            <HomeRecentTradeCard
              trade={trade}
              type={activeSegment}
            />
          </div>
        ))}
      </div>
      {!isLoading && canExpandTodayRange && (
        <button
          onClick={() => setExpandTodayRange((prev) => !prev)}
          className="w-full h-10 rounded-xl border border-border/60 bg-card text-xs font-semibold text-primary motion-press"
        >
          {expandTodayRange ? t('showLess') : `${t('showMoreToday')} (${todayRangeTrades.length})`}
        </button>
      )}
    </div>
  );
}