import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PeriodSelect from "@/components/layout/PeriodSelect";
import { fetchIndustryDetailFromApi } from "@/api/services/industryDetail";
import { companyPathFromTicker } from "@/data/insiderEntities";
import { cn, formatCurrency } from "@/lib/utils";
import type { IndustryCompareSide, Period } from "@/data/mockData";
import { useLanguage } from "@/i18n/LanguageContext";

const PERIODS: Period[] = ["1D", "7D", "30D", "90D"];

function parsePeriod(raw: string | null): Period {
  if (raw && PERIODS.includes(raw as Period)) return raw as Period;
  return "30D";
}

function parseSide(raw: string | null): IndustryCompareSide {
  return raw === "sell" ? "sell" : "buy";
}

export default function IndustryComparePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const period = parsePeriod(searchParams.get("period"));
  const side = parseSide(searchParams.get("side"));
  const sector = searchParams.get("sector") || "Other";
  const { locale, t } = useLanguage();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["industry-detail", sector, side, period, locale],
    queryFn: () => fetchIndustryDetailFromApi(sector, side, period, locale),
    staleTime: 60_000,
  });

  const activeSector = data?.sector ?? sector;

  const sectorChips = useMemo(() => {
    if (!data?.sectors.length) return [];
    return [...data.sectors].sort((a, b) => {
      const aScore = side === "buy" ? a.buyAmount : a.sellAmount;
      const bScore = side === "buy" ? b.buyAmount : b.sellAmount;
      return bScore - aScore;
    });
  }, [data?.sectors, side]);

  const setPeriod = (next: Period) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("period", next);
    setSearchParams(nextParams, { replace: true });
  };

  const setSide = (next: IndustryCompareSide) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("side", next);
    setSearchParams(nextParams, { replace: true });
  };

  const selectSector = (nameKey: string) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("sector", nameKey);
    setSearchParams(nextParams, { replace: true });
  };

  const activeLabel =
    sectorChips.find((s) => s.nameKey === activeSector)?.name ??
    data?.sectors.find((s) => s.nameKey === activeSector)?.name ??
    activeSector;

  return (
    <motion.div
      className="min-h-screen bg-canvas pb-tab-safe"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <header className="sticky top-0 z-30 border-b border-border/80 bg-canvas/95 px-3 pb-2 pt-safe backdrop-blur-xl">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 py-1 text-xs font-medium text-accent-blue"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t.industryComparePage.back}
        </button>

        <motion.div
          className="flex items-center justify-between gap-2"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-base font-bold tracking-tight">
            {t.industryComparePage.title}
          </h1>
          <PeriodSelect value={period} onChange={setPeriod} />
        </motion.div>

        <motion.div
          className="mt-2 flex flex-wrap items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <button
            type="button"
            onClick={() => setSide("buy")}
            className={cn(
              "rounded-pill px-2.5 py-1 text-[11px] font-semibold",
              side === "buy" ? "bg-buy/20 text-buy" : "bg-white/10 text-muted"
            )}
          >
            {t.industry.buyPct}
          </button>
          <button
            type="button"
            onClick={() => setSide("sell")}
            className={cn(
              "rounded-pill px-2.5 py-1 text-[11px] font-semibold",
              side === "sell" ? "bg-sell/20 text-sell" : "bg-white/10 text-muted"
            )}
          >
            {t.industry.sellPct}
          </button>
          <span className="rounded-pill bg-white/10 px-2.5 py-1 text-[11px] font-medium text-muted">
            {period}
          </span>
        </motion.div>

        {!isLoading && sectorChips.length > 0 ? (
          <div className="horizontal-scroll mt-3 gap-2 pb-1">
            {sectorChips.map((chip) => {
              const active = chip.nameKey === activeSector;
              return (
                <button
                  key={chip.nameKey}
                  type="button"
                  onClick={() => selectSector(chip.nameKey)}
                  className={cn(
                    "snap-card shrink-0 rounded-pill px-3 py-1.5 text-xs font-semibold transition-colors",
                    active
                      ? "bg-white text-canvas"
                      : "bg-white/10 text-muted"
                  )}
                >
                  {chip.name}
                </button>
              );
            })}
          </div>
        ) : null}
      </header>

      <motion.div className="px-3 py-3" layout>
        {isLoading ? (
          <motion.div className="space-y-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 rounded-2xl shimmer-loading" />
            ))}
          </motion.div>
        ) : isError || !data ? (
          <p className="text-sm text-muted">{t.industryComparePage.empty}</p>
        ) : (
          <>
            <p className="mb-2 px-1 text-xs text-muted">{activeLabel}</p>
            <ul className="space-y-2">
              {data.companies.length === 0 ? (
                <li className="glass-card p-4 text-center text-sm text-muted">
                  {t.industryComparePage.noCompanies}
                </li>
              ) : (
                data.companies.map((row, i) => (
                  <motion.li
                    key={row.ticker}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <button
                      type="button"
                      onClick={() => navigate(companyPathFromTicker(row.ticker))}
                      className="glass-card flex w-full items-center gap-3 p-3 text-left"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-xs font-bold">
                        {row.ticker.slice(0, 2)}
                      </span>
                      <motion.div className="min-w-0 flex-1" layout>
                        <p className="truncate text-sm font-semibold">
                          {row.companyName}
                        </p>
                        <p className="text-xs text-muted">{row.ticker}</p>
                        <p className="mt-0.5 text-[10px] text-muted">
                          {t.industryComparePage.companyMeta(
                            formatCurrency(row.amount),
                            row.tradeCount,
                            row.insiderCount
                          )}
                        </p>
                      </motion.div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
                    </button>
                  </motion.li>
                ))
              )}
            </ul>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
