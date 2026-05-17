import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import IndustryChain from "@/components/dashboard/IndustryChain";
import PeriodSelect from "@/components/layout/PeriodSelect";
import PullToRefresh from "@/components/layout/PullToRefresh";
import { useDataMode } from "@/context/DataModeContext";
import { fetchDashboard, type Period } from "@/data/mockData";
import { useLanguage } from "@/i18n/LanguageContext";

const QUERY_KEY = "mobile-dashboard";
const PERIODS: Period[] = ["1D", "7D", "30D", "90D"];

function parsePeriod(raw: string | null): Period {
  if (raw && PERIODS.includes(raw as Period)) return raw as Period;
  return "30D";
}

export default function IndustryChainPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const period = parsePeriod(searchParams.get("period"));
  const { locale, t } = useLanguage();
  const { mode: dataMode } = useDataMode();
  const queryClient = useQueryClient();

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [QUERY_KEY, period, locale, dataMode],
    queryFn: () => fetchDashboard(period, locale, dataMode),
    staleTime: 60_000,
  });

  const setPeriod = (next: Period) => {
    setSearchParams({ period: next }, { replace: true });
  };

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
  };

  return (
    <div className="min-h-screen bg-canvas pb-tab-safe">
      <PullToRefresh onRefresh={refresh}>
        <header className="sticky top-0 z-30 border-b border-border/80 bg-canvas/90 px-3 pb-2 pt-safe backdrop-blur-xl">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 py-1 text-xs font-medium text-accent-blue"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t.tabs.dashboard}
          </button>
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h1 className="text-base font-bold tracking-tight">
                {t.industry.industryChain}
              </h1>
              {data ? (
                <p className="text-[10px] text-muted">
                  {t.header.dataAsOf} {data.meta.dataAsOf}
                  <span className="mx-1 text-border-strong">•</span>
                  {period}
                </p>
              ) : null}
            </div>
            <PeriodSelect value={period} onChange={setPeriod} />
          </div>
          {isFetching ? (
            <div className="mt-2 h-0.5 w-full origin-left animate-pulse bg-accent-blue" />
          ) : null}
        </header>

        <div className="px-3 py-2">
          {isLoading || !data ? (
            <motion.div className="space-y-1.5">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-[4.5rem] rounded-2xl shimmer-loading"
                />
              ))}
            </motion.div>
          ) : data.industryChain.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">
              {t.industryChainPage.empty}
            </p>
          ) : (
            <IndustryChain nodes={data.industryChain} period={period} compact />
          )}
        </div>
      </PullToRefresh>
    </div>
  );
}
