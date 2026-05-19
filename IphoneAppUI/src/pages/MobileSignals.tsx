import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import AISummary from "@/components/dashboard/AISummary";
import SignalCard from "@/components/signals/SignalCard";
import PeriodToggle from "@/components/layout/PeriodToggle";
import FeedToggle, { type SignalFeedFilter } from "@/components/layout/FeedToggle";
import TierToggle, { type SignalTierFilter } from "@/components/layout/TierToggle";
import PullToRefresh from "@/components/layout/PullToRefresh";
import { fetchSignals } from "@/api/services/signals";
import { useLanguage } from "@/i18n/LanguageContext";
import type { Period } from "@/data/mockData";

const QUERY_KEY = "mobile-signals";

function defaultTier(period: Period): SignalTierFilter {
  return period === "1D" ? "medium_plus" : "all";
}

export default function MobileSignals() {
  const { t, locale } = useLanguage();
  const [period, setPeriod] = useState<Period>("7D");
  const [feed, setFeed] = useState<SignalFeedFilter>("all");
  const [tier, setTier] = useState<SignalTierFilter>("all");

  useEffect(() => {
    setTier(defaultTier(period));
  }, [period]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: [QUERY_KEY, period, feed, tier, locale],
    queryFn: () => fetchSignals(period, feed, locale, tier),
    staleTime: 60_000,
  });

  return (
    <PullToRefresh
      onRefresh={async () => {
        await refetch();
      }}
    >
      <div className="min-h-screen pb-tab-safe">
        <header className="sticky top-0 z-40 border-b border-border/60 bg-canvas/95 px-4 pb-3 pt-safe backdrop-blur-xl">
          <h1 className="text-lg font-semibold">{t.signalsPage.title}</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">{t.signalsPage.subtitle}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <PeriodToggle value={period} onChange={setPeriod} />
            <FeedToggle value={feed} onChange={setFeed} />
            <TierToggle value={tier} onChange={setTier} />
          </div>
        </header>
        <div className="mx-4 mt-4 space-y-3">
          {isLoading && (
            <div className="h-36 rounded-card shimmer-loading" aria-hidden />
          )}
          {!isLoading && data?.aiSummary && <AISummary data={data.aiSummary} />}
          {isLoading &&
            [0, 1, 2].map((i) => (
              <div key={i} className="h-28 rounded-xl shimmer-loading" />
            ))}
          {!isLoading && data?.signals.length === 0 && (
            <p className="py-12 text-center text-sm text-muted-foreground">
              {t.signalsPage.empty}
            </p>
          )}
          {data?.signals.map((s, i) => (
            <SignalCard key={s.id} signal={s} index={i} />
          ))}
        </div>
      </div>
    </PullToRefresh>
  );
}
