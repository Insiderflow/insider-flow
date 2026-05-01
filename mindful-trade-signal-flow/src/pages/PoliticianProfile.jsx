import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { getPoliticianTradesByName, getWatchlistItem, addToWatchlist, removeFromWatchlist } from '@/lib/api';
import PoliticianProfileHeader from '@/components/politician/PoliticianProfileHeader';
import PerformanceChart from '@/components/politician/PerformanceChart';
import TradesFeed from '@/components/politician/TradesFeed';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/lib/useTranslation';
import PaidOnlyGate from '@/components/billing/PaidOnlyGate';

export default function PoliticianProfile() {
  const { t } = useTranslation();
  return (
    <PaidOnlyGate headerTitle={t('politiciansSegment')}>
      <PoliticianProfileContent />
    </PaidOnlyGate>
  );
}

function PoliticianProfileContent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const politicianName = searchParams.get('name');
  const sectorParam = searchParams.get('sector');
  const { t } = useTranslation();

  const [politician, setPolitician] = useState(null);
  const [trades, setTrades] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [chartError, setChartError] = useState(null);
  const [isWatched, setIsWatched] = useState(false);
  const [watchlistItem, setWatchlistItem] = useState(null);
  const [watchLoading, setWatchLoading] = useState(false);

  const watchlistIdentifier = politician?.politician_id || '';
  const resolvedSector = sectorParam || politician?.sector || null;

  const loadData = async () => {
    setIsLoading(true);
    setChartError(null);
    const filtered = await getPoliticianTradesByName(politicianName);
    setPolitician(filtered[0] || null);
    setTrades(filtered);
    setIsLoading(false);
  };

  const loadWatchlist = async () => {
    const lookupKey = watchlistIdentifier || politicianName;
    if (!lookupKey) return;
    const item = await getWatchlistItem('politician', lookupKey);
    if (item) {
      setIsWatched(true);
      setWatchlistItem(item);
      return;
    }
    setIsWatched(false);
    setWatchlistItem(null);
  };

  useEffect(() => {
    if (!politicianName) { navigate('/politicians'); return; }
    loadData();
  }, [politicianName]);

  useEffect(() => {
    if (!watchlistIdentifier) return;
    loadWatchlist();
  }, [watchlistIdentifier]);

  const handleWatch = async () => {
    if (watchLoading || !politicianName) return;
    setWatchLoading(true);
    // Optimistic update
    const optimistic = !isWatched;
    setIsWatched(optimistic);

    try {
      if (!optimistic && watchlistItem) {
        await removeFromWatchlist(watchlistItem.id);
      } else {
        const created = await addToWatchlist({
          type: 'politician',
          identifier: watchlistIdentifier || politicianName,
          label: politicianName,
        });
        setWatchlistItem(created);
      }
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    } catch (e) {
      // Ignore optimistic drift and sync from server below.
      toast({
        title: 'Watchlist update failed',
        description: e?.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      await loadWatchlist();
      setWatchLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-40 bg-background/85 backdrop-blur-xl border-b border-border/50">
        {isLoading ? (
          <div className="px-4 py-4 flex items-center gap-3">
            <Skeleton className="w-6 h-6 rounded" />
            <Skeleton className="h-4 w-40" />
          </div>
        ) : (
          <PoliticianProfileHeader
            politician={politician}
            sector={resolvedSector}
            isWatched={isWatched}
            onWatch={handleWatch}
            onBack={() => navigate(-1)}
          />
        )}
      </div>

      {/* Performance Chart */}
      <div className="mt-4">
        <div className="px-4 mb-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('performance')}</p>
        </div>
        <PerformanceChart
          trades={trades}
          politicianName={politicianName}
          isLoading={isLoading}
          error={chartError}
          onRetry={() => { setChartError(null); loadData(); }}
        />
      </div>

      {/* Trades feed */}
      <div className="mt-2">
        <div className="px-4 mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('trades')}</p>
          <span className="text-[11px] text-muted-foreground">{trades.length} {t('totalTrades')}</span>
        </div>
        <TradesFeed trades={trades} isLoading={isLoading} />
      </div>
    </div>
  );
}