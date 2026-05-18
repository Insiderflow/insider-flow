import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import DateChips from "@/components/live/DateChips";
import LivePageHeader from "@/components/live/LivePageHeader";
import LiveSearchBar from "@/components/live/LiveSearchBar";
import LiveSubTabs from "@/components/live/LiveSubTabs";
import LiveTradeCard from "@/components/live/LiveTradeCard";
import MarketStatusBar from "@/components/live/MarketStatusBar";
import PullToRefresh from "@/components/layout/PullToRefresh";
import { fetchLiveFeed, type LiveFeedMode } from "@/data/liveMockData";
import { useDataMode } from "@/context/DataModeContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { tradeHasFlags } from "@/types/tradeFlags";

const QUERY_KEY = "mobile-live";

export default function MobileLive() {
  const { locale, t } = useLanguage();
  const { mode: dataMode } = useDataMode();
  const [mode, setMode] = useState<LiveFeedMode>("live");
  const [query, setQuery] = useState("");
  const [flagsOnly, setFlagsOnly] = useState(false);
  const [selectedDate, setSelectedDate] = useState("2026-05-15");

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: [QUERY_KEY, locale, dataMode],
    queryFn: () => fetchLiveFeed(locale, dataMode),
    staleTime: 30_000,
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    return data.trades.filter((tr) => {
      const matchesDate = mode === "live" || tr.dateKey === selectedDate;
      const matchesQuery =
        !q ||
        tr.ticker.toLowerCase().includes(q) ||
        tr.displayName.toLowerCase().includes(q);
      const matchesFlags = !flagsOnly || tradeHasFlags(tr.flags);
      return matchesDate && matchesQuery && matchesFlags;
    });
  }, [data, mode, query, selectedDate, flagsOnly]);

  if (isLoading || !data) {
    return (
      <div className="min-h-screen pb-tab-safe">
        <div className="shimmer-loading mx-auto mt-8 h-6 w-24 rounded-lg" />
        <div className="mx-4 mt-6 h-11 rounded-xl shimmer-loading" />
        <div className="mx-4 mt-4 space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-36 rounded-card shimmer-loading" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-tab-safe">
      <LivePageHeader />
      <LiveSubTabs mode={mode} onChange={setMode} />

      <PullToRefresh onRefresh={async () => { await refetch(); }}>
        <div className="space-y-3 px-4 pt-4">
          <LiveSearchBar value={query} onChange={setQuery} />

          <button
            type="button"
            onClick={() => setFlagsOnly((v) => !v)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
              flagsOnly
                ? "border-amber-500/50 bg-amber-500/20 text-amber-100"
                : "border-white/10 bg-white/5 text-muted"
            }`}
            aria-pressed={flagsOnly}
          >
            {flagsOnly ? t.tradeFlags.filterOnly : t.tradeFlags.filterOff}
          </button>

          {mode === "history" && (
            <DateChips
              dates={data.dates}
              selected={selectedDate}
              onSelect={setSelectedDate}
            />
          )}

          <MarketStatusBar marketOpen={data.marketOpen} etClock={data.etClock} />

          {isFetching && (
            <div className="h-0.5 w-full origin-left animate-pulse bg-accent-blue" />
          )}

          {filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted">{t.live.empty}</p>
          ) : (
            <ul className="space-y-2.5 pb-4">
              {filtered.map((tr, i) => (
                <li key={tr.id}>
                  <LiveTradeCard trade={tr} index={i} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </PullToRefresh>
    </div>
  );
}
