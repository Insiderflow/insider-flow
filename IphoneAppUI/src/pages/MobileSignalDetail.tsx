import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import PoliticianAvatar from "@/components/politician/PoliticianAvatar";
import TradeFlagBadges from "@/components/trade/TradeFlagBadges";
import SignalCriteriaTable from "@/components/signals/SignalCriteriaTable";
import { resolveSignalRecommendation } from "@/lib/signalRecommendation";
import SignalSideBadge, { tradeSideLabel } from "@/components/signals/SignalSideBadge";
import SignalScoreRing from "@/components/signals/SignalScoreRing";
import SignalScoreBreakdown from "@/components/signals/SignalScoreBreakdown";
import { fetchSignalDetail } from "@/api/services/signals";
import { companyPathFromTicker } from "@/data/insiderEntities";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn, formatCurrency } from "@/lib/utils";
import type { TradeFlagCode } from "@/types/tradeFlags";

function daysSince(isoDate: string): number {
  const filed = new Date(isoDate).getTime();
  if (Number.isNaN(filed)) return 0;
  return Math.max(0, (Date.now() - filed) / (1000 * 60 * 60 * 24));
}

export default function MobileSignalDetail() {
  const { signalId } = useParams<{ signalId: string }>();
  const navigate = useNavigate();
  const { t, locale } = useLanguage();

  const { data, isLoading, error } = useQuery({
    queryKey: ["mobile-signal-detail", signalId, locale],
    queryFn: () => fetchSignalDetail(signalId!, locale),
    enabled: Boolean(signalId),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center pb-tab-safe pt-safe">
        <div className="h-8 w-8 animate-pulse rounded-full bg-white/10" />
      </div>
    );
  }

  if (!data || error) {
    return (
      <div className="min-h-screen px-4 pb-tab-safe pt-safe">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-sm text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.signalDetail.back}
        </button>
        <p className="text-center text-sm text-muted-foreground">
          {t.signalDetail.notFound}
        </p>
      </div>
    );
  }

  const { signal, criteria, clusterSize, sizePercentile, scoreBreakdown, sameTickerCount, thresholds } =
    data;
  const isCorporate = signal.feed === "corporate";
  const recommendation = resolveSignalRecommendation(signal);
  const tradeSide = tradeSideLabel(signal.side, t);
  const daysAgo = daysSince(signal.filedAt);
  const percentilePct = Math.round(sizePercentile * 100);

  const profilePath = isCorporate
    ? signal.ownerId
      ? `/insider/person/person-${signal.ownerId}`
      : signal.politicianId
        ? `/insider/person/${signal.politicianId}`
        : null
    : signal.politicianId
      ? `/politician/${encodeURIComponent(signal.politicianId)}`
      : null;
  const companyPath =
    signal.ticker && signal.ticker !== "—"
      ? companyPathFromTicker(signal.ticker)
      : null;

  const accentBorder =
    recommendation === "buy"
      ? "border-l-buy"
      : recommendation === "sell"
        ? "border-l-sell"
        : "border-l-muted-foreground";

  const insightLine = t.signalDetail.insight({
    name: signal.politicianName,
    side: tradeSide,
    ticker: signal.ticker,
    amount: formatCurrency(signal.amountUsd),
    percentile: percentilePct,
    daysAgo,
  });

  const tickerContext = isCorporate
    ? t.signalDetail.tickerContextCorporate({
        count: sameTickerCount,
        ticker: signal.ticker,
        side: tradeSide,
        days: thresholds.clusterWindowDays,
      })
    : clusterSize >= 2
      ? t.signalDetail.tickerContextCongress({
          count: clusterSize,
          ticker: signal.ticker,
          side: tradeSide,
          days: thresholds.clusterWindowDays,
        })
      : null;

  return (
    <div className="min-h-screen pb-tab-safe">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-canvas/95 px-4 pb-3 pt-safe backdrop-blur-xl">
        <button
          type="button"
          onClick={() => navigate("/signals")}
          className="mb-2 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.signalDetail.back}
        </button>
        <p className="text-xs text-muted-foreground">{t.signalDetail.title}</p>
      </header>

      <div className="mx-4 mt-4 space-y-4">
        <section
          className={cn(
            "glass-card-elevated overflow-hidden border-l-4 p-4",
            accentBorder,
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{signal.ticker}</h1>
                <SignalSideBadge recommendation={recommendation} />
                <span className="text-[10px] text-muted-foreground">
                  {t.signalsPage.filingLabel(tradeSide)}
                </span>
                <span className="rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {t.signalsPage.feedBadge[signal.feed]}
                </span>
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {signal.issuerName}
              </p>
            </div>
            <SignalScoreRing
              score={signal.mlScore}
              tier={signal.mlTier}
              tierLabel={t.signalsPage.mlTier[signal.mlTier]}
            />
          </div>

          <div className="mt-4 flex items-end justify-between gap-3 border-t border-border/40 pt-4">
            <div>
              <p className="text-3xl font-bold tabular-nums tracking-tight">
                {formatCurrency(signal.amountUsd)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{signal.filedAt}</p>
            </div>
            <TradeFlagBadges flags={signal.flags as TradeFlagCode[]} />
          </div>

          <p className="mt-3 rounded-lg bg-white/5 px-3 py-2 text-xs leading-relaxed text-foreground/90">
            {insightLine}
          </p>

          {tickerContext && (
            <p className="mt-2 text-[11px] text-muted-foreground">{tickerContext}</p>
          )}
        </section>

        <section className="glass-card-elevated p-4">
          <div className="flex items-center gap-3">
            <PoliticianAvatar
              politicianId={isCorporate ? undefined : signal.politicianId}
              name={signal.politicianName}
              imageUrl={signal.imageUrl}
              party={isCorporate ? undefined : signal.party}
              size="md"
            />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{signal.politicianName}</p>
              <p className="text-xs text-muted-foreground">
                {t.signalsPage.feedBadge[signal.feed]} · {signal.filedAt}
              </p>
            </div>
            {profilePath && (
              <button
                type="button"
                onClick={() => navigate(profilePath)}
                className="shrink-0 text-xs font-medium text-accent-purple"
              >
                {isCorporate ? t.signalDetail.viewInsider : t.signalDetail.viewPolitician}
              </button>
            )}
          </div>

          <div className="mt-4 border-t border-border/40 pt-4">
            <SignalScoreBreakdown
              breakdown={scoreBreakdown}
              labels={t.signalDetail.scoreBreakdown}
              title={t.signalDetail.scoreTitle}
            />
          </div>
        </section>

        <section>
          <h2 className="mb-2 px-0.5 text-sm font-semibold">
            {t.signalDetail.whyFlagged}
          </h2>
          <SignalCriteriaTable rows={criteria} />
          <p className="mt-2 px-0.5 text-[10px] leading-relaxed text-muted-foreground">
            {t.signalDetail.disclaimer}
          </p>
        </section>

        {companyPath && (
          <section className="space-y-2 pb-6">
            <h2 className="px-0.5 text-sm font-semibold">{t.signalDetail.links}</h2>
            <button
              type="button"
              onClick={() => navigate(companyPath)}
              className="flex w-full items-center justify-between rounded-card border border-border/60 bg-surface-elevated/80 px-4 py-3 text-left text-sm"
            >
              {t.signalDetail.viewCompany}
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          </section>
        )}
      </div>
    </div>
  );
}
