import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";

export type SignalRecommendation = "buy" | "sell" | "hold";

const STYLE: Record<
  SignalRecommendation,
  { pill: string; dot: string }
> = {
  buy: {
    pill: "bg-buy-muted text-buy",
    dot: "bg-buy shadow-[0_0_8px_rgba(34,197,94,0.5)]",
  },
  sell: {
    pill: "bg-sell-muted text-sell",
    dot: "bg-sell shadow-[0_0_8px_rgba(239,68,68,0.5)]",
  },
  hold: {
    pill: "bg-white/10 text-muted-foreground",
    dot: "bg-muted-foreground/80",
  },
};

interface SignalSideBadgeProps {
  /** ML-derived action hint — not the raw filing direction. */
  recommendation: SignalRecommendation;
  variant?: "pill" | "dot";
  className?: string;
}

export default function SignalSideBadge({
  recommendation,
  variant = "pill",
  className,
}: SignalSideBadgeProps) {
  const { t } = useLanguage();
  const label = t.signalsPage.recommendation[recommendation];
  const style = STYLE[recommendation];

  if (variant === "dot") {
    return (
      <span
        className={cn("h-2.5 w-2.5 shrink-0 rounded-full", style.dot, className)}
        title={label}
        aria-label={t.signalsPage.recommendationAria(recommendation)}
      />
    );
  }

  return (
    <span
      className={cn(
        "rounded-md px-1.5 py-0.5 text-[10px] font-bold tracking-wide",
        style.pill,
        className,
      )}
      title={t.signalsPage.recommendationAria(recommendation)}
    >
      {label}
    </span>
  );
}

export function tradeSideLabel(
  side: string,
  t: { signalsPage: { tradeSide: Record<string, string> } },
): string {
  if (side === "buy") return t.signalsPage.tradeSide.buy;
  if (side === "sell") return t.signalsPage.tradeSide.sell;
  return t.signalsPage.tradeSide.proposed_sale;
}
