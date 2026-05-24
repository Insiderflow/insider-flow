import { LayoutDashboard, Radio, Search, Settings, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";

export type TabId = "dashboard" | "live" | "signals" | "search" | "settings";

interface TabBarProps {
  active: TabId;
  onChange?: (tab: TabId) => void;
}

const TAB_IDS: TabId[] = ["dashboard", "live", "signals", "search", "settings"];

const ICONS = {
  dashboard: LayoutDashboard,
  live: Radio,
  signals: Zap,
  search: Search,
  settings: Settings,
} as const;

export default function TabBar({ active, onChange }: TabBarProps) {
  const { t } = useLanguage();

  const labels: Record<TabId, string> = {
    dashboard: t.tabs.dashboard,
    live: t.tabs.live,
    signals: t.tabs.signals,
    search: t.tabs.search,
    settings: t.tabs.settings,
  };

  return (
    <nav className="tab-dock" aria-label="Main">
      <div className="flex h-[var(--tab-bar-height)] items-center justify-around px-1">
        {TAB_IDS.map((id) => {
          const Icon = ICONS[id];
          const isActive = active === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange?.(id)}
              className={cn("tab-dock-item", isActive && "tab-dock-item-active")}
            >
              <span className={cn("tab-dock-icon-wrap", !isActive && "text-muted-foreground")}>
                <Icon className="h-[18px] w-[18px]" strokeWidth={isActive ? 2.5 : 2} />
              </span>
              <span className={cn("text-[9px] font-semibold", isActive && "text-flow")}>
                {labels[id]}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
