import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import PoliticianAvatar from "@/components/politician/PoliticianAvatar";
import TradeFlagBadges from "@/components/trade/TradeFlagBadges";
import SignalCriteriaTable from "@/components/signals/SignalCriteriaTable";
import { fetchSignalDetail } from "@/api/services/signals";
import { companyPathFromTicker } from "@/data/insiderEntities";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn, formatCurrency } from "@/lib/utils";
import type { TradeFlagCode } from "@/types/tradeFlags";

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

  const { signal, criteria } = data;
  const isCorporate = signal.feed === "corporate";
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

  const tierClass =
    signal.mlTier === "high"
      ? "bg-accent-purple/25 text-accent-purple"
      : signal.mlTier === "medium"
        ? "bg-amber-500/20 text-amber-400"
        : "bg-muted text-muted-foreground";

  const sideLabel =
    signal.side === "buy"
      ? t.trade.buy
      : signal.side === "sell"
        ? t.trade.sell
        : t.trade.proposedSale;

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
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">{t.signalDetail.title}</p>
            <h1 className="text-2xl font-bold tracking-tight">{signal.ticker}</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">{signal.issuerName}</p>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold tabular-nums",
              tierClass,
            )}
          >
            {t.signalsPage.mlScore(signal.mlScore)} ·{" "}
            {t.signalsPage.mlTier[signal.mlTier]}
          </span>
        </div>
      </header>

      <div className="mx-4 mt-4 space-y-4">
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
                {t.signalsPage.feedBadge[signal.feed]} · {sideLabel} ·{" "}
                {signal.filedAt}
              </p>
              <p className="mt-1 text-sm font-medium tabular-nums">
                {formatCurrency(signal.amountUsd)}
              </p>
            </div>
            <TradeFlagBadges flags={signal.flags as TradeFlagCode[]} />
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

        <section className="space-y-2 pb-6">
          <h2 className="px-0.5 text-sm font-semibold">{t.signalDetail.links}</h2>
          {profilePath && (
            <button
              type="button"
              onClick={() => navigate(profilePath)}
              className="flex w-full items-center justify-between rounded-card border border-border/60 bg-surface-elevated/80 px-4 py-3 text-left text-sm"
            >
              {isCorporate ? t.signalDetail.viewInsider : t.signalDetail.viewPolitician}
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
          {companyPath && (
            <button
              type="button"
              onClick={() => navigate(companyPath)}
              className="flex w-full items-center justify-between rounded-card border border-border/60 bg-surface-elevated/80 px-4 py-3 text-left text-sm"
            >
              {t.signalDetail.viewCompany}
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </section>
      </div>
    </div>
  );
}
