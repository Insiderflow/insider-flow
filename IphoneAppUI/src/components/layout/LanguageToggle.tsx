import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";
import type { Locale } from "@/i18n/types";

export default function LanguageToggle() {
  const { locale, t, setLocale } = useLanguage();

  const options: { id: Locale; label: string }[] = [
    { id: "zh-Hant", label: t.lang.traditional },
    { id: "zh-Hans", label: t.lang.simplified },
  ];

  return (
    <div
      role="group"
      aria-label={t.lang.switchAria}
      className="flex shrink-0 rounded-pill border border-border bg-surface-elevated/80 p-0.5"
    >
      {options.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          aria-pressed={locale === id}
          onClick={() => setLocale(id)}
          className={cn(
            "min-w-[28px] rounded-pill px-2 py-1 text-[11px] font-bold transition-all",
            locale === id
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
