import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search as SearchIcon, X, Clock, ChevronRight, TrendingUp, Landmark, ArrowUpRight } from 'lucide-react';
import { getAllTradesForSearch } from '@/lib/api';

const LS_KEY = 'insiderflow_recent_searches';
const MAX_RECENT = 6;

function useRecentSearches() {
  const [recent, setRecent] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
  });
  const add = useCallback((item) => {
    setRecent(prev => {
      const next = [item, ...prev.filter(r => r.id !== item.id)].slice(0, MAX_RECENT);
      localStorage.setItem(LS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);
  const clear = useCallback(() => {
    localStorage.removeItem(LS_KEY);
    setRecent([]);
  }, []);
  return { recent, add, clear };
}

function ResultRow({ icon: Icon, iconBg, iconColor, title, subtitle, meta, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 border-b border-border/30 last:border-0 hover:bg-secondary/30 transition-colors text-left"
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{title}</p>
        {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
      </div>
      {meta && <span className="font-mono text-xs font-bold text-primary flex-shrink-0">{meta}</span>}
      <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/50 flex-shrink-0" />
    </button>
  );
}

function SectionHeader({ title, count }) {
  return (
    <div className="px-4 py-2 bg-secondary/40 border-b border-border/30 flex items-center justify-between">
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{title}</p>
      {count != null && <span className="text-[10px] text-muted-foreground">{count} results</span>}
    </div>
  );
}

export default function Search() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const { recent, add, clear } = useRecentSearches();
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 220);
    return () => clearTimeout(t);
  }, [query]);

  const { data, isLoading } = useQuery({
    queryKey: ['search-all-trades'],
    queryFn: getAllTradesForSearch,
    staleTime: 5 * 60 * 1000,
  });

  const politicians = data?.politicians || [];
  const corporate = data?.corporate || [];

  const { politicianResults, tickerResults, suggestions } = useMemo(() => {
    const q = debouncedQuery.toLowerCase().trim();
    if (!q) return { politicianResults: [], tickerResults: [], suggestions: [] };

    // Unique politicians matching query
    const polMap = new Map();
    politicians.forEach(t => {
      if (
        t.politician_name?.toLowerCase().includes(q) ||
        t.party?.toLowerCase().includes(q) ||
        t.state?.toLowerCase().includes(q)
      ) {
        if (!polMap.has(t.politician_name)) polMap.set(t.politician_name, t);
      }
    });

    // Unique tickers matching query
    const tickerMap = new Map();
    [...politicians, ...corporate].forEach(t => {
      if (
        t.ticker?.toLowerCase().includes(q) ||
        t.company_name?.toLowerCase().includes(q)
      ) {
        if (!tickerMap.has(t.ticker)) tickerMap.set(t.ticker, t);
      }
    });

    // Suggestions: unique tickers from politicians
    const suggSet = new Set();
    const suggs = [];
    politicians.forEach(t => {
      if (t.ticker && !suggSet.has(t.ticker) && t.ticker.toLowerCase().includes(q)) {
        suggSet.add(t.ticker);
        suggs.push(t.ticker);
      }
    });

    return {
      politicianResults: [...polMap.values()],
      tickerResults: [...tickerMap.values()],
      suggestions: suggs.slice(0, 8),
    };
  }, [debouncedQuery, politicians, corporate]);

  const hasResults = politicianResults.length > 0 || tickerResults.length > 0;
  const showIdle = !debouncedQuery;

  const handleSelect = (type, value, label, subtitle) => {
    const item = { id: `${type}-${value}`, type, value, label, subtitle };
    add(item);
    if (type === 'politician') navigate(`/politician?name=${encodeURIComponent(value)}`);
    else navigate(`/issuer?ticker=${encodeURIComponent(value)}`);
  };

  const handleRecentClick = (item) => {
    add(item);
    if (item.type === 'politician') navigate(`/politician?name=${encodeURIComponent(item.value)}`);
    else navigate(`/issuer?ticker=${encodeURIComponent(item.value)}`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Search bar */}
      <div className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border/50 px-4 py-3">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search politicians, tickers, companies…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-secondary rounded-xl h-11 pl-9 pr-10 text-sm outline-none placeholder:text-muted-foreground/60 border border-border/50 focus:border-primary/50 transition-colors"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); inputRef.current?.focus(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1">
        {/* Loading shimmer */}
        {isLoading && (
          <div className="px-4 pt-6 space-y-2">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-12 rounded-xl bg-secondary/50 animate-pulse" />
            ))}
          </div>
        )}

        {/* Idle: recent + suggestions */}
        {!isLoading && showIdle && (
          <div className="pt-4">
            {recent.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between px-4 mb-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recent</p>
                  <button onClick={clear} className="text-[11px] text-muted-foreground hover:text-foreground">Clear</button>
                </div>
                <div className="bg-card mx-4 rounded-2xl border border-border/50 overflow-hidden">
                  {recent.map(item => (
                    <ResultRow
                      key={item.id}
                      icon={item.type === 'politician' ? Landmark : TrendingUp}
                      iconBg={item.type === 'politician' ? 'bg-blue-500/10' : 'bg-primary/10'}
                      iconColor={item.type === 'politician' ? 'text-blue-400' : 'text-primary'}
                      title={item.label}
                      subtitle={item.subtitle}
                      meta={item.type === 'ticker' ? item.value : null}
                      onClick={() => handleRecentClick(item)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Trending tickers */}
            <div className="px-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Trending This Week
              </p>
              <div className="flex flex-wrap gap-2">
                {['NVDA', 'AAPL', 'TSLA', 'META', 'JPM', 'MSFT', 'AMZN', 'XOM'].map(ticker => (
                  <button
                    key={ticker}
                    onClick={() => handleSelect('ticker', ticker, ticker, '')}
                    className="font-mono text-xs font-bold px-3 py-1.5 rounded-lg bg-card border border-border/50 text-primary hover:border-primary/50 transition-colors"
                  >
                    {ticker}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {!isLoading && !showIdle && (
          <>
            {!hasResults ? (
              <div className="flex flex-col items-center justify-center pt-20 px-6 text-center">
                <SearchIcon className="h-8 w-8 text-muted-foreground/40 mb-3" />
                <p className="text-sm font-semibold mb-1">No results for "{debouncedQuery}"</p>
                <p className="text-xs text-muted-foreground">Try a politician name, ticker, or company.</p>
              </div>
            ) : (
              <div className="bg-card mx-4 mt-4 rounded-2xl border border-border/50 overflow-hidden">
                {politicianResults.length > 0 && (
                  <>
                    <SectionHeader title="Politicians" count={politicianResults.length} />
                    {politicianResults.slice(0, 5).map(t => (
                      <ResultRow
                        key={t.id}
                        icon={Landmark}
                        iconBg="bg-blue-500/10"
                        iconColor="text-blue-400"
                        title={t.politician_name}
                        subtitle={`${t.party} · ${t.chamber} · ${t.state}`}
                        onClick={() => handleSelect('politician', t.politician_name, t.politician_name, `${t.party} · ${t.chamber} · ${t.state}`)}
                      />
                    ))}
                  </>
                )}
                {tickerResults.length > 0 && (
                  <>
                    <SectionHeader title="Stocks & Companies" count={tickerResults.length} />
                    {tickerResults.slice(0, 5).map(t => (
                      <ResultRow
                        key={t.ticker}
                        icon={TrendingUp}
                        iconBg="bg-primary/10"
                        iconColor="text-primary"
                        title={t.company_name || t.ticker}
                        subtitle={t.sector}
                        meta={t.ticker}
                        onClick={() => handleSelect('ticker', t.ticker, t.company_name || t.ticker, t.sector)}
                      />
                    ))}
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}