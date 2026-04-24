import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getIssuerTrades, getWatchlistItem, addToWatchlist, removeFromWatchlist } from '@/lib/api';
import IssuerHeader from '@/components/issuer/IssuerHeader';
import PriceChart from '@/components/issuer/PriceChart';
import InsiderActivityList from '@/components/issuer/InsiderActivityList';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

export default function IssuerProfile() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const ticker = searchParams.get('ticker');

  const [isLoading, setIsLoading] = useState(true);
  const [politicianTrades, setPoliticianTrades] = useState([]);
  const [corporateTrades, setCorporateTrades] = useState([]);
  const [isWatched, setIsWatched] = useState(false);
  const [watchlistItem, setWatchlistItem] = useState(null);
  const [watchLoading, setWatchLoading] = useState(false);
  const [chartError, setChartError] = useState(null);
  const [isFallback] = useState(false); // would be true when falling back to Yahoo

  // Derived from trades
  const companyName = [...politicianTrades, ...corporateTrades].find(t => t.ticker === ticker)?.company_name || ticker;
  const sector = [...politicianTrades, ...corporateTrades].find(t => t.ticker === ticker)?.sector || null;

  const loadData = async () => {
    if (!ticker) return;
    setIsLoading(true);
    setChartError(null);
    const { politicianTrades: pTrades, corporateTrades: cTrades } = await getIssuerTrades(ticker);
    setPoliticianTrades(pTrades);
    setCorporateTrades(cTrades);
    setIsLoading(false);
  };

  const loadWatchlist = async () => {
    if (!ticker) return;
    const item = await getWatchlistItem('ticker', ticker);
    if (item) { setIsWatched(true); setWatchlistItem(item); }
  };

  useEffect(() => {
    if (!ticker) { navigate(-1); return; }
    loadData();
    loadWatchlist();
  }, [ticker]);

  const handleWatch = async () => {
    if (watchLoading) return;
    setWatchLoading(true);
    const optimistic = !isWatched;
    setIsWatched(optimistic);

    if (!optimistic && watchlistItem) {
      await removeFromWatchlist(watchlistItem.id);
      setWatchlistItem(null);
    } else {
      const created = await addToWatchlist({ type: 'ticker', identifier: ticker, label: `${ticker}${companyName ? ' — ' + companyName : ''}` });
      setWatchlistItem(created);
    }
    setWatchLoading(false);
  };

  // No ticker guard
  if (!ticker) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3 px-6 text-center">
        <AlertCircle className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-semibold">No ticker specified</p>
        <button onClick={() => navigate(-1)} className="text-xs text-primary font-medium">Go back</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Sticky header */}
      <div className="sticky top-0 z-40 bg-background/85 backdrop-blur-xl border-b border-border/50">
        {isLoading ? (
          <div className="px-4 py-4 flex items-center gap-3">
            <Skeleton className="w-6 h-6 rounded" />
            <Skeleton className="h-4 w-40" />
          </div>
        ) : (
          <IssuerHeader
            ticker={ticker}
            companyName={companyName}
            sector={sector}
            country="US"
            isWatched={isWatched}
            onWatch={handleWatch}
            onBack={() => navigate(-1)}
          />
        )}
      </div>

      {/* Price chart */}
      <div className="mt-4">
        <div className="px-4 mb-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Price History</p>
        </div>
        <PriceChart
          ticker={ticker}
          isLoading={isLoading}
          error={chartError}
          isFallback={isFallback}
          onRetry={() => { setChartError(null); loadData(); }}
        />
      </div>

      {/* Insider activity */}
      <div className="mt-2">
        <div className="px-4 mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Insider Activity</p>
          <span className="text-[11px] text-muted-foreground">
            {politicianTrades.length + corporateTrades.length} trades
          </span>
        </div>
        <InsiderActivityList
          politicianTrades={politicianTrades}
          corporateTrades={corporateTrades}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}