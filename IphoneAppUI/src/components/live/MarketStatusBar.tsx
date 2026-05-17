import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";

interface MarketStatusBarProps {
  marketOpen: boolean;
  etClock: string;
}

export default function MarketStatusBar({ marketOpen, etClock }: MarketStatusBarProps) {
  const { t } = useLanguage();

  return (
    <div className="flex items-center justify-between text-xs">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span
          className={cn(
            "h-2 w-2 rounded-full",
            marketOpen ? "bg-buy animate-pulse-soft" : "bg-muted"
          )}
        />
        <span className="font-medium tracking-wide">
          {marketOpen ? t.live.marketOpen : t.live.marketClosed}
        </span>
      </div>
      <div className="flex items-center gap-1.5 text-muted">
        <Clock className="h-3.5 w-3.5" />
        <span>{t.live.etTime(etClock)}</span>
      </div>
    </div>
  );
}
