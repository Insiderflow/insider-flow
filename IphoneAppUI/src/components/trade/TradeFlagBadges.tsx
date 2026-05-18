import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";
import type { TradeFlagCode } from "@/types/tradeFlags";

interface TradeFlagBadgesProps {
  flags?: TradeFlagCode[];
  className?: string;
  max?: number;
}

export default function TradeFlagBadges({
  flags,
  className,
  max = 2,
}: TradeFlagBadgesProps) {
  const { t } = useLanguage();
  if (!flags?.length) return null;

  const visible = flags.slice(0, max);
  const extra = flags.length - visible.length;

  return (
    <div className={cn("flex flex-wrap items-center gap-1", className)}>
      {visible.map((code) => (
        <span
          key={code}
          className="rounded-md border border-amber-500/35 bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-amber-200"
        >
          {t.tradeFlags[code]}
        </span>
      ))}
      {extra > 0 ? (
        <span className="text-[9px] font-medium text-amber-200/80">+{extra}</span>
      ) : null}
    </div>
  );
}
