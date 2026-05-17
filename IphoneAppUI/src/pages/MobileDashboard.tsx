import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { USE_API } from "@/api/config";
import { fetchDataFreshness } from "@/api/services/freshness";
import AISummary from "@/components/dashboard/AISummary";
import IndustryChainPreviewCard from "@/components/dashboard/IndustryChainPreviewCard";
import InsiderIndustrySection from "@/components/insider/InsiderIndustrySection";
import TodaysPoliticianTrades from "@/components/dashboard/TodaysPoliticianTrades";
import KpiCard from "@/components/dashboard/KpiCard";
import PoliticianCard from "@/components/dashboard/PoliticianCard";
import RecentTradesTimeline from "@/components/dashboard/RecentTradesTimeline";
import InsiderDashboard from "@/components/insider/InsiderDashboard";
import MobileHeader from "@/components/layout/MobileHeader";
import PullToRefresh from "@/components/layout/PullToRefresh";
import { fetchDashboard, type Period } from "@/data/mockData";
import { visibleDashboardKpis } from "@/lib/dashboardKpis";
import { useDataMode } from "@/context/DataModeContext";
import { useLanguage } from "@/i18n/LanguageContext";

const QUERY_KEY = "mobile-dashboard";
const FRESHNESS_KEY = "data-freshness";

export default function MobileDashboard() {
  const [period, setPeriod] = useState<Period>("30D");
  const { locale, t } = useLanguage();
  const { mode: dataMode } = useDataMode();
  const queryClient = useQueryClient();
  const lastPublishedAtRef = useRef<string | null>(null);

  const { data: freshness } = useQuery({
    queryKey: [FRESHNESS_KEY],
    queryFn: fetchDataFreshness,
    enabled: USE_API,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });

  useEffect(() => {
    const publishedAt = freshness?.latest?.published_at ?? null;
    if (!publishedAt) return;
    if (
      lastPublishedAtRef.current &&
      lastPublishedAtRef.current !== publishedAt
    ) {
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    }
    lastPublishedAtRef.current = publishedAt;
  }, [freshness?.latest?.published_at, queryClient]);

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: [QUERY_KEY, period, locale, dataMode],
    queryFn: () => fetchDashboard(period, locale, dataMode),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
      queryClient.invalidateQueries({ queryKey: [FRESHNESS_KEY] }),
    ]);
  };

  if (isError) {
    return (
      <div className="px-4 pb-tab-safe pt-safe">
        <p className="mt-6 text-sm font-semibold text-sell">API 載入失敗</p>
        <p className="mt-2 text-xs leading-relaxed text-muted">
          {error instanceof Error ? error.message : String(error)}
        </p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="mt-4 rounded-xl bg-accent-blue px-4 py-2 text-sm font-semibold text-white"
        >
          重試
        </button>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="pb-tab-safe">
        <div className="shimmer-loading mx-4 mt-6 h-8 w-40 rounded-lg" />
        <div className="mx-4 mt-4 h-32 rounded-card shimmer-loading" />
        <div className="mx-4 mt-4 grid grid-cols-2 gap-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-24 rounded-card shimmer-loading" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PullToRefresh onRefresh={refresh}>
        <div className="px-4 pb-tab-safe">
          <MobileHeader
            meta={data.meta}
            period={period}
            onPeriodChange={setPeriod}
          />

          {isFetching && (
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              className="mb-2 h-0.5 origin-left bg-accent-blue"
            />
          )}

          <motion.div
            className="mt-4 space-y-6"
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.06 } },
            }}
          >
            {dataMode === "insider" && data.insiderExtras ? (
              <InsiderDashboard data={data} period={period} />
            ) : (
              <>
            <AISummary data={data.aiSummary} />

            <section>
              <h2 className="section-title mb-3 px-1">{t.sections.overview}</h2>
              <div className="flex flex-wrap gap-2">
                {visibleDashboardKpis(data.kpis).map((kpi, i) => (
                  <KpiCard key={kpi.id} item={kpi} index={i} />
                ))}
              </div>
            </section>

            <section>
              <h2 className="section-title mb-3 px-1">
                {dataMode === "insider" ? t.sections.insiderBuy : t.sections.politicianBuy}
              </h2>
              <div className="space-y-2">
                {data.topPoliticianBuys.map((tr) => (
                  <PoliticianCard key={tr.id} trade={tr} />
                ))}
              </div>
            </section>

            <section>
              <h2 className="section-title mb-3 px-1">
                {dataMode === "insider" ? t.sections.insiderSale : t.sections.politicianSale}
              </h2>
              <div className="space-y-2">
                {data.topPoliticianSells.map((tr) => (
                  <PoliticianCard key={tr.id} trade={tr} />
                ))}
              </div>
            </section>

            <IndustryChainPreviewCard
              nodes={data.industryChain}
              period={period}
            />

            {dataMode === "politician" ? (
              <TodaysPoliticianTrades trades={data.todaysTrades ?? []} />
            ) : (
              <InsiderIndustrySection
                topIndustries={data.topIndustries}
                period={period}
              />
            )}

            <RecentTradesTimeline trades={data.recentTrades} />
              </>
            )}
          </motion.div>
        </div>
      </PullToRefresh>

    </div>
  );
}
