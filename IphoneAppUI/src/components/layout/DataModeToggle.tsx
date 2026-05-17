import { cn } from "@/lib/utils";
import { useDataMode, type DataMode } from "@/context/DataModeContext";
import { useLanguage } from "@/i18n/LanguageContext";

export default function DataModeToggle({ className }: { className?: string }) {
  const { mode, setMode } = useDataMode();
  const { t } = useLanguage();

  const options: { id: DataMode; label: string }[] = [
    { id: "politician", label: t.dataMode.politician },
    { id: "insider", label: t.dataMode.insider },
  ];

  return (
    <div
      role="group"
      aria-label={t.dataMode.switchAria}
      className={cn(
        "flex max-w-[168px] rounded-pill border border-border bg-surface-elevated/90 p-0.5",
        className
      )}
    >
      {options.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          aria-pressed={mode === id}
          onClick={() => setMode(id)}
          className={cn(
            "flex-1 rounded-pill px-2 py-1 text-[10px] font-bold leading-tight transition-all",
            mode === id
              ? "bg-white/15 text-white shadow-sm"
              : "text-muted hover:text-muted-foreground"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
