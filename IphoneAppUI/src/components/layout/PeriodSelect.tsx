import { ChevronDown } from "lucide-react";
import type { Period } from "@/data/mockData";
import { useLanguage } from "@/i18n/LanguageContext";

const PERIODS: Period[] = ["1D", "7D", "30D", "90D"];

interface PeriodSelectProps {
  value: Period;
  onChange: (p: Period) => void;
}

/** Compact period dropdown (reference industry-chain header). */
export default function PeriodSelect({ value, onChange }: PeriodSelectProps) {
  const { t } = useLanguage();

  return (
    <label className="relative shrink-0">
      <span className="sr-only">{t.period.aria}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as Period)}
        className="appearance-none rounded-lg border border-border bg-surface-elevated/90 py-1 pl-2 pr-6 text-[11px] font-semibold text-white"
      >
        {PERIODS.map((p) => (
          <option key={p} value={p} className="bg-canvas text-white">
            {p}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted"
        aria-hidden
      />
    </label>
  );
}
