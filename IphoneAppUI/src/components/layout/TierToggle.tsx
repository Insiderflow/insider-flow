import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";

export type SignalTierFilter = "all" | "medium_plus" | "high";

const TIERS: SignalTierFilter[] = ["high", "medium_plus", "all"];

interface TierToggleProps {
  value: SignalTierFilter;
  onChange: (t: SignalTierFilter) => void;
}

export default function TierToggle({ value, onChange }: TierToggleProps) {
  const { t } = useLanguage();

  return (
    <div
      className="flex shrink-0 rounded-pill border border-border bg-surface-elevated/80 p-0.5"
      role="tablist"
      aria-label={t.signalsPage.tierAria}
    >
      {TIERS.map((tier) => (
        <button
          key={tier}
          type="button"
          role="tab"
          aria-selected={value === tier}
          onClick={() => onChange(tier)}
          className={cn(
            "rounded-pill px-2.5 py-1 text-[11px] font-semibold transition-all",
            value === tier
              ? "bg-white/15 text-white shadow-sm"
              : "text-muted hover:text-muted-foreground",
          )}
        >
          {t.signalsPage.tier[tier]}
        </button>
      ))}
    </div>
  );
}
