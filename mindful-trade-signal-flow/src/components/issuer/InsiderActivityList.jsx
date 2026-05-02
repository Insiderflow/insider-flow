import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import EmptyState from '@/components/insider/EmptyState';
import { Activity } from 'lucide-react';
import { useTranslation } from '@/lib/useTranslation';

function ActivityRow({ trade, type }) {
  const { t, displaySector } = useTranslation();
  const isBuy = trade.trade_type === 'Buy';
  const name = type === 'politician' ? trade.politician_name : trade.insider_name;
  const sectorText = displaySector(trade.sector) || t('unknown');
  const role = type === 'politician'
    ? `${t('sector')}: ${sectorText}`
    : trade.title || '';
  const amount = type === 'politician'
    ? trade.amount_range
    : trade.total_value ? `$${Number(trade.total_value).toLocaleString()}` : '';

  return (
    <div className="flex items-center gap-3 py-3.5 px-3 rounded-xl border border-border/40 bg-card/60">
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
        isBuy ? 'bg-buy/10' : 'bg-sell/10'
      }`}>
        {isBuy
          ? <TrendingUp className="h-4 w-4 text-buy" />
          : <TrendingDown className="h-4 w-4 text-sell" />
        }
      </div>
      <div className="flex-1 min-w-0">
        {type === 'politician' ? (
          <Link
            to={`/politician?name=${encodeURIComponent(trade.politician_name || '')}&sector=${encodeURIComponent(trade.sector || '')}`}
            className="block min-w-0"
          >
            <p className="text-sm font-semibold truncate text-primary hover:underline active:opacity-70">{name}</p>
            <p className="text-[11px] text-muted-foreground truncate">{role}</p>
          </Link>
        ) : (
          <>
            <p className="text-sm font-semibold truncate">{name}</p>
            <p className="text-[11px] text-muted-foreground truncate">{role}</p>
          </>
        )}
      </div>
      <div className="text-right flex-shrink-0">
        <p className={`text-xs font-semibold ${isBuy ? 'text-buy' : 'text-sell'}`}>
          {isBuy ? t('buy') : t('sell')}
        </p>
        {amount && <p className="text-[11px] text-muted-foreground tabular-nums font-medium">{amount}</p>}
        <p className="text-[10px] text-muted-foreground">
          {trade.trade_date ? format(new Date(trade.trade_date), 'MMM d') : ''}
        </p>
      </div>
    </div>
  );
}

export default function InsiderActivityList({ politicianTrades, corporateTrades, isLoading }) {
  const { t } = useTranslation();
  const combined = [
    ...(politicianTrades || []).map(t => ({ ...t, _type: 'politician' })),
    ...(corporateTrades || []).map(t => ({ ...t, _type: 'corporate' })),
  ].sort((a, b) => new Date(b.trade_date) - new Date(a.trade_date));

  if (isLoading) {
    return (
      <div className="px-4 space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-3 items-center py-2">
            <Skeleton className="w-8 h-8 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-4 w-14" />
          </div>
        ))}
      </div>
    );
  }

  if (combined.length === 0) {
    return (
      <div className="px-4">
        <EmptyState
          icon={Activity}
          title={t('noInsiderActivity')}
          description={t('noTradesForIssuer')}
        />
      </div>
    );
  }

  return (
    <div className="px-4 space-y-2">
      {combined.map((trade, idx) => (
        <div
          key={trade.id || idx}
          className="motion-stagger-item"
          style={{ '--stagger-delay': `${Math.min(idx, 9) * 35}ms` }}
        >
          <ActivityRow trade={trade} type={trade._type} />
        </div>
      ))}
    </div>
  );
}