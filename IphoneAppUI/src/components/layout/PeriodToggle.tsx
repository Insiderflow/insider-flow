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
    <div className="control-pill flex shrink-0" role="tablist" aria-label={t.period.aria}>
      {PERIODS.map((p) => (
        <button
          key={p}
          type="button"
          role="tab"
          aria-selected={value === p}
          onClick={() => onChange(p)}
          className={cn(
            "rounded-pill px-2 py-1 font-mono text-[10px] font-semibold transition-all",
            value === p
              ? "control-pill-active"
              : "text-muted hover:text-muted-foreground"
          )}
        >
          {p}
        </button>
      ))}
    </div>
  );
}
