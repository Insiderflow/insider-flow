import { cn } from "@/lib/utils";

interface SettingsToggleProps {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}

export default function SettingsToggle({
  title,
  description,
  checked,
  disabled,
  onChange,
}: SettingsToggleProps) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3.5">
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-medium text-white">{title}</p>
        <p className="mt-0.5 text-xs leading-snug text-muted">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-7 w-12 shrink-0 items-center rounded-pill transition-colors",
          checked ? "bg-accent-blue" : "bg-white/15",
          disabled && "opacity-50"
        )}
      >
        <span
          className={cn(
            "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-6" : "translate-x-1"
          )}
        />
      </button>
    </div>
  );
}
