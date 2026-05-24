import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";

export type SignalSideFilter = "all" | "buy" | "sell" | "hold";

const SIDES: SignalSideFilter[] = ["all", "buy", "sell", "hold"];

interface SideToggleProps {
  value: SignalSideFilter;
  onChange: (s: SignalSideFilter) => void;
}

export default function SideToggle({ value, onChange }: SideToggleProps) {
  const { t } = useLanguage();

  return (
    <div
      className="flex shrink-0 rounded-pill border border-border bg-surface-elevated/80 p-0.5"
      role="tablist"
      aria-label={t.signalsPage.sideAria}
    >
      {SIDES.map((s) => (
        <button
          key={s}
          type="button"
          role="tab"
          aria-selected={value === s}
          onClick={() => onChange(s)}
          className={cn(
            "rounded-pill px-2.5 py-1 text-[11px] font-semibold transition-all",
            value === s
              ? "bg-white/15 text-white shadow-sm"
              : "text-muted hover:text-muted-foreground",
          )}
        >
          {t.signalsPage.sideFilter[s]}
        </button>
      ))}
    </div>
  );
}
