import type { InsiderActivityStats, InsiderCompanyActivity } from "@/data/insiderEntities";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn, formatCurrencyExact } from "@/lib/utils";

type ActivityInput = InsiderActivityStats &
  Partial<
    Pick<
      InsiderCompanyActivity,
      | "plan10b5TxCount"
      | "plan10b5Pct"
      | "buyRangeMin"
      | "buyRangeMax"
      | "sellRangeMin"
      | "sellRangeMax"
    >
  >;

interface InsiderActivityPanelProps {
  activity: ActivityInput;
  periodLabel?: string;
  className?: string;
}

export default function InsiderActivityPanel({
  activity: a,
  periodLabel = "30D",
  className,
}: InsiderActivityPanelProps) {
  const { t } = useLanguage();
  const flowTotal = a.totalBuys + a.totalSells;
  const buyShare = flowTotal > 0 ? (a.totalBuys / flowTotal) * 100 : 50;

  const plan10b5TxCount = a.plan10b5TxCount ?? 0;
  const plan10b5Pct = a.plan10b5Pct ?? 0;

  const buyRange =
    a.buyRangeMin != null && a.buyRangeMax != null
      ? `$${a.buyRangeMin.toFixed(2)} – $${a.buyRangeMax.toFixed(2)}`
      : null;
  const sellRange =
    a.sellRangeMin != null && a.sellRangeMax != null
      ? `$${a.sellRangeMin.toFixed(2)} – $${a.sellRangeMax.toFixed(2)}`
      : null;

  return (
    <section className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">{t.insiderProfile.liveActivity}</h2>
        <span className="rounded-pill border border-border bg-white/[0.04] px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          {periodLabel}
        </span>
      </div>
      <p className="text-[11px] leading-relaxed text-muted">{t.insiderProfile.liveActivitySub}</p>

      <div className="activity-flow-card">
        <div className="flex items-end justify-between gap-4">
          <FlowColumn
            label={t.insiderProfile.totalBuys}
            value={formatCurrencyExact(a.totalBuys)}
            sub={`${a.buyTxCount} ${t.insiderProfile.transactions}`}
            tone="buy"
          />
          <FlowColumn
            label={t.insiderProfile.totalSells}
            value={formatCurrencyExact(a.totalSells)}
            sub={`${a.sellTxCount} ${t.insiderProfile.transactions}`}
            tone="sell"
            align="end"
          />
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-pill bg-white/[0.06]">
          <div
            className="h-full rounded-pill bg-gradient-to-r from-buy via-buy/80 to-sell transition-all duration-500"
            style={{ width: `${Math.max(8, Math.min(92, buyShare))}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <MiniMetric
          label={t.kpi.options}
          value={String(a.optionTxCount)}
          hint={formatCurrencyExact(a.totalOptions)}
        />
        <MiniMetric
          label={t.kpi.plan10b5}
          value={`${plan10b5Pct}%`}
          hint={
            plan10b5TxCount > 0
              ? `${plan10b5TxCount} ${t.insiderProfile.transactions}`
              : "—"
          }
          accent="plan"
        />
        <MiniMetric
          label={t.insiderProfile.avgBuy}
          value={a.avgBuy > 0 ? `$${a.avgBuy.toFixed(0)}` : "—"}
          hint={a.avgSell > 0 ? `sell $${a.avgSell.toFixed(0)}` : undefined}
        />
      </div>

      {buyRange || sellRange ? (
        <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground">
          {buyRange ? (
            <span className="rounded-lg bg-white/[0.04] px-2.5 py-1.5">
              <span className="text-muted">{t.insiderProfile.buyRange}: </span>
              <span className="font-medium text-white/90">{buyRange}</span>
            </span>
          ) : null}
          {sellRange ? (
            <span className="rounded-lg bg-white/[0.04] px-2.5 py-1.5">
              <span className="text-muted">{t.insiderProfile.sellRange}: </span>
              <span className="font-medium text-white/90">{sellRange}</span>
            </span>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function FlowColumn({
  label,
  value,
  sub,
  tone,
  align = "start",
}: {
  label: string;
  value: string;
  sub: string;
  tone: "buy" | "sell";
  align?: "start" | "end";
}) {
  return (
    <div className={cn(align === "end" && "text-right")}>
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted">{label}</p>
      <p
        className={cn(
          "mt-1 text-xl font-bold tabular-nums tracking-tight",
          tone === "buy" ? "text-buy" : "text-sell"
        )}
      >
        {value}
      </p>
      <p className="mt-0.5 text-[10px] text-muted-foreground">{sub}</p>
    </div>
  );
}

function MiniMetric({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: "plan";
}) {
  return (
    <div className="rounded-xl border border-border bg-surface-elevated/60 px-2.5 py-2.5">
      <p className="text-[9px] font-medium uppercase tracking-wide text-muted">{label}</p>
      <p
        className={cn(
          "mt-1 text-base font-bold tabular-nums leading-none",
          accent === "plan" ? "text-plan" : "text-white"
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 truncate text-[9px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
