import { cn } from "@/lib/utils";
import type { Period } from "@/data/mockData";
import { useLanguage } from "@/i18n/LanguageContext";

const PERIODS: Period[] = ["1D", "7D", "30D", "90D"];

interface PeriodToggleProps {
  value: Period;
  onChange: (p: Period) => void;
}

export default function PeriodToggle({ value, onChange }: PeriodToggleProps) {
  const { t } = useLanguage();

  return (
    <div
      className="flex shrink-0 rounded-pill border border-border bg-surface-elevated/80 p-0.5"
      role="tablist"
      aria-label={t.period.aria}
    >
      {PERIODS.map((p) => (
        <button
          key={p}
          type="button"
          role="tab"
          aria-selected={value === p}
          onClick={() => onChange(p)}
          className={cn(
            "rounded-pill px-2.5 py-1 text-[11px] font-semibold transition-all",
            value === p
              ? "bg-white/15 text-white shadow-sm"
              : "text-muted hover:text-muted-foreground"
          )}
        >
          {p}
        </button>
      ))}
    </div>
  );
}
