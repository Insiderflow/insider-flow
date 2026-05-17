import { Search, SlidersHorizontal } from "lucide-react";
import { useDataMode } from "@/context/DataModeContext";
import { useLanguage } from "@/i18n/LanguageContext";

interface LiveSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export default function LiveSearchBar({ value, onChange }: LiveSearchBarProps) {
  const { t } = useLanguage();
  const { isInsider } = useDataMode();
  const placeholder = isInsider
    ? t.live.searchPlaceholderInsider
    : t.live.searchPlaceholder;

  return (
    <div className="flex gap-2">
      <label className="relative flex min-w-0 flex-1 items-center">
        <Search className="pointer-events-none absolute left-3 h-4 w-4 text-muted" />
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-11 w-full rounded-xl border border-border bg-surface-elevated/90 pl-9 pr-3 text-sm text-white placeholder:text-muted outline-none ring-accent-blue/40 focus:ring-2"
        />
      </label>
      <button
        type="button"
        aria-label={t.live.filterAria}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-elevated/90 text-muted-foreground transition-colors hover:text-white"
      >
        <SlidersHorizontal className="h-4 w-4" />
      </button>
    </div>
  );
}
