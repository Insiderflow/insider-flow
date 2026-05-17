import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";
import type { LiveFeedMode } from "@/data/liveMockData";

interface LiveSubTabsProps {
  mode: LiveFeedMode;
  onChange: (mode: LiveFeedMode) => void;
}

export default function LiveSubTabs({ mode, onChange }: LiveSubTabsProps) {
  const { t } = useLanguage();
  const tabs: { id: LiveFeedMode; label: string }[] = [
    { id: "live", label: t.live.subTabLive },
    { id: "history", label: t.live.subTabHistory },
  ];

  return (
    <div className="flex border-b border-border px-4">
      {tabs.map((tab) => {
        const active = mode === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative flex-1 pb-3 pt-1 text-sm font-medium transition-colors",
              active ? "text-white" : "text-muted hover:text-muted-foreground"
            )}
          >
            {tab.label}
            {active && (
              <span className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-white" />
            )}
          </button>
        );
      })}
    </div>
  );
}
