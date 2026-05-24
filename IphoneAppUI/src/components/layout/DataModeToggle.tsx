import { useNavigate } from "react-router-dom";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDataMode, type DataMode } from "@/context/DataModeContext";
import { useLanguage } from "@/i18n/LanguageContext";

export default function DataModeToggle({ className }: { className?: string }) {
  const navigate = useNavigate();
  const { mode, setMode } = useDataMode();
  const { t } = useLanguage();

  const options: { id: DataMode; label: string }[] = [
    { id: "politician", label: t.dataMode.politician },
    { id: "insider", label: t.dataMode.insider },
  ];

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div
        role="group"
        aria-label={t.dataMode.switchAria}
        className="control-pill flex"
      >
        {options.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            aria-pressed={mode === id}
            onClick={() => setMode(id)}
            className={cn(
              "rounded-pill px-2.5 py-1 text-[10px] font-bold leading-tight transition-all",
              mode === id
                ? "control-pill-active"
                : "text-muted hover:text-muted-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => navigate("/signals")}
        aria-label={t.dataMode.signalsLinkAria}
        className="flex h-7 w-7 items-center justify-center rounded-lg border border-flow/25 bg-flow/10 text-flow transition-colors hover:bg-flow/20"
      >
        <Zap className="h-3.5 w-3.5" strokeWidth={2.5} />
      </button>
    </div>
  );
}
