import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getPoliticianTradesByName, getWatchlistItem, addToWatchlist, removeFromWatchlist } from '@/lib/api';
import PoliticianProfileHeader from '@/components/politician/PoliticianProfileHeader';
import PerformanceChart from '@/components/politician/PerformanceChart';
import TradesFeed from '@/components/politician/TradesFeed';
import { Skeleton } from '@/components/ui/skeleton';

export default function PoliticianProfile() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const politicianName = searchParams.get('name');

  const [politician, setPolitician] = useState(null);
  const [trades, setTrades] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [chartError, setChartError] = useState(null);
  const [isWatched, setIsWatched] = useState(false);
  const [watchlistItem, setWatchlistItem] = useState(null);
  const [watchLoading, setWatchLoading] = useState(false);

  const cachedAt = useMemo(() => {
    const now = new Date();
    return `${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setChartError(null);
    const filtered = await getPoliticianTradesByName(politicianName);
    setPolitician(filtered[0] || null);
    setTrades(filtered);
    setIsLoading(false);
  };

  const loadWatchlist = async () => {
    const item = await getWatchlistItem('politician', politicianName);
    if (item) { setIsWatched(true); setWatchlistItem(item); }
  };

  useEffect(() => {
    if (!politicianName) { navigate('/politicians'); return; }
    loadData();
    loadWatchlist();
  }, [politicianName]);

  const handleWatch = async () => {
    if (watchLoading) return;
    setWatchLoading(true);
    // Optimistic update
    const optimistic = !isWatched;
    setIsWatched(optimistic);

    if (!optimistic && watchlistItem) {
      await removeFromWatchlist(watchlistItem.id);
      setWatchlistItem(null);
    } else {
      const created = await addToWatchlist({ type: 'politician', identifier: politicianName, label: politicianName });
      setWatchlistItem(created);
    }
    setWatchLoading(false);
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
            isWatched={isWatched}
            onWatch={handleWatch}
            onBack={() => navigate(-1)}
          />
        )}
      </div>

      {/* Performance Chart */}
      <div className="mt-4">
        <div className="px-4 mb-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Performance</p>
        </div>
        <PerformanceChart
          trades={trades}
          isLoading={isLoading}
          error={chartError}
          onRetry={() => { setChartError(null); loadData(); }}
          cachedAt={cachedAt}
        />
      </div>

      {/* Trades feed */}
      <div className="mt-2">
        <div className="px-4 mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Trades</p>
          <span className="text-[11px] text-muted-foreground">{trades.length} total</span>
        </div>
        <TradesFeed trades={trades} isLoading={isLoading} />
      </div>
    </div>
  );
}