import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsRowProps {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  destructive?: boolean;
  showChevron?: boolean;
  trailing?: React.ReactNode;
}

export default function SettingsRow({
  icon: Icon,
  label,
  onClick,
  destructive = false,
  showChevron = true,
  trailing,
}: SettingsRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 px-4 py-3.5 text-left text-[15px] transition-colors active:bg-white/5",
        destructive ? "text-sell" : "text-white"
      )}
    >
      <Icon
        className={cn(
          "h-[18px] w-[18px] shrink-0",
          destructive ? "text-sell" : "text-muted-foreground"
        )}
        strokeWidth={1.75}
      />
      <span className="flex-1 font-normal">{label}</span>
      {trailing}
      {showChevron && !trailing && (
        <ChevronRight
          className={cn(
            "h-4 w-4 shrink-0",
            destructive ? "text-sell/70" : "text-muted"
          )}
          strokeWidth={2}
        />
      )}
    </button>
  );
}
