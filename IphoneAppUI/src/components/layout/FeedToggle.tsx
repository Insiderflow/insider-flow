import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";

export type SignalFeedFilter = "all" | "politician" | "corporate";

const FEEDS: SignalFeedFilter[] = ["all", "politician", "corporate"];

interface FeedToggleProps {
  value: SignalFeedFilter;
  onChange: (f: SignalFeedFilter) => void;
}

export default function FeedToggle({ value, onChange }: FeedToggleProps) {
  const { t } = useLanguage();

  return (
    <div
      className="flex shrink-0 rounded-pill border border-border bg-surface-elevated/80 p-0.5"
      role="tablist"
      aria-label={t.signalsPage.feedAria}
    >
      {FEEDS.map((f) => (
        <button
          key={f}
          type="button"
          role="tab"
          aria-selected={value === f}
          onClick={() => onChange(f)}
          className={cn(
            "rounded-pill px-2.5 py-1 text-[11px] font-semibold transition-all",
            value === f
              ? "bg-white/15 text-white shadow-sm"
              : "text-muted hover:text-muted-foreground",
          )}
        >
          {t.signalsPage.feed[f]}
        </button>
      ))}
    </div>
  );
}
