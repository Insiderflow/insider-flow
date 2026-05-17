import { LayoutDashboard, Radio, Search, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";

export type TabId = "dashboard" | "live" | "search" | "settings";

interface TabBarProps {
  active: TabId;
  onChange?: (tab: TabId) => void;
}

const TAB_IDS: TabId[] = ["dashboard", "live", "search", "settings"];

const ICONS = {
  dashboard: LayoutDashboard,
  live: Radio,
  search: Search,
  settings: Settings,
} as const;

export default function TabBar({ active, onChange }: TabBarProps) {
  const { t } = useLanguage();

  const labels: Record<TabId, string> = {
    dashboard: t.tabs.dashboard,
    live: t.tabs.live,
    search: t.tabs.search,
    settings: t.tabs.settings,
  };

  return (
    <nav
      className="fixed bottom-0 left-1/2 z-50 w-full max-w-[390px] -translate-x-1/2 border-t border-border bg-surface-elevated/95 backdrop-blur-xl"
      style={{ paddingBottom: "var(--safe-bottom)" }}
    >
      <div className="flex h-[var(--tab-bar-height)] items-center justify-around px-2">
        {TAB_IDS.map((id) => {
          const Icon = ICONS[id];
          const isActive = active === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange?.(id)}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 transition-colors",
                isActive ? "text-white" : "text-muted"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5",
                  isActive && "text-accent-blue drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className={cn("text-[10px] font-medium", isActive && "font-semibold")}>
                {labels[id]}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
