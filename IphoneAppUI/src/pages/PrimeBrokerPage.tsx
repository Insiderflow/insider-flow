import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import PeriodSelect from "@/components/layout/PeriodSelect";
import { fetchPrimeBrokerFromApi } from "@/api/services/primeBroker";
import { cn, formatCurrency } from "@/lib/utils";
import type { Period } from "@/data/mockData";
import { useLanguage } from "@/i18n/LanguageContext";

const PERIODS: Period[] = ["1D", "7D", "30D", "90D"];

function parsePeriod(raw: string | null): Period {
  if (raw && PERIODS.includes(raw as Period)) return raw as Period;
  return "7D";
}

export default function PrimeBrokerPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const period = parsePeriod(searchParams.get("period"));
  const { locale, t } = useLanguage();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["prime-broker", id, period, locale],
    queryFn: () => fetchPrimeBrokerFromApi(id, period, locale),
    enabled: Boolean(id),
    staleTime: 60_000,
  });

  const setPeriod = (next: Period) => {
    setSearchParams({ period: next }, { replace: true });
  };

  return (
    <motion.div
      className="min-h-screen bg-canvas pb-tab-safe"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <header className="sticky top-0 z-30 border-b border-border/80 bg-canvas/90 px-3 pb-2 pt-safe backdrop-blur-xl">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 py-1 text-xs font-medium text-accent-blue"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t.primeBrokerPage.back}
        </button>
        <motion.div
          className="flex items-center justify-between gap-2"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-bold tracking-tight">
              {data?.name ?? id.replace(/-/g, " ")}
            </h1>
            {data ? (
              <p className="text-[10px] text-muted">
                {t.primeBrokerPage.industryCount(data.industryCount, period)}
              </p>
            ) : null}
          </div>
          <PeriodSelect value={period} onChange={setPeriod} />
        </motion.div>
      </header>

      <div className="px-3 py-3">
        {isLoading ? (
          <motion.div className="space-y-2">
            <motion.div
              className="h-20 rounded-2xl shimmer-loading"
              initial={{ opacity: 0.5 }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="h-14 rounded-2xl shimmer-loading"
                initial={{ opacity: 0.4 }}
                animate={{ opacity: [0.4, 0.9, 0.4] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.08 }}
              />
            ))}
          </motion.div>
        ) : isError || !data ? (
          <p className="px-1 text-sm text-muted">{t.primeBrokerPage.empty}</p>
        ) : (
          <>
            <motion.div
              className="glass-card mb-4 p-4 text-center"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
                {t.industry.primeBrokerFlow}
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-buy">
                {formatCurrency(data.flowAmount)}
              </p>
              <p className="mt-1 text-xs text-muted">
                {t.primeBrokerPage.topIndustries}
              </p>
            </motion.div>

            <ul className="space-y-2">
              {data.industries.map((row, i) => (
                <motion.li
                  key={row.nameKey}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <motion.div
                    className="glass-card flex items-center gap-3 p-3"
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-xs font-bold">
                      {row.nameKey.slice(0, 3)}
                    </span>
                    <motion.div className="min-w-0 flex-1" layout>
                      <p className="text-sm font-semibold">{row.name}</p>
                      <p className="text-[10px] text-muted">
                        {t.primeBrokerPage.rowMeta(
                          formatCurrency(row.amount),
                          row.tradeCount,
                          row.pct
                        )}
                      </p>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-pill bg-white/10">
                        <motion.div
                          className={cn("h-full rounded-pill bg-accent-blue")}
                          initial={{ width: 0 }}
                          animate={{ width: `${row.pct}%` }}
                          transition={{ duration: 0.5, delay: 0.1 + i * 0.05 }}
                        />
                      </div>
                    </motion.div>
                    <span className="text-sm font-semibold tabular-nums">{row.pct}%</span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
                  </motion.div>
                </motion.li>
              ))}
            </ul>
          </>
        )}
      </div>
    </motion.div>
  );
}
