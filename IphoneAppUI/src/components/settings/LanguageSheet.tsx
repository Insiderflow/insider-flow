import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";
import type { Locale } from "@/i18n/types";

interface LanguageSheetProps {
  open: boolean;
  onClose: () => void;
}

export default function LanguageSheet({ open, onClose }: LanguageSheetProps) {
  const { locale, t, setLocale } = useLanguage();

  if (!open) return null;

  const options: { id: Locale; label: string }[] = [
    { id: "zh-Hant", label: t.lang.traditional },
    { id: "zh-Hans", label: t.lang.simplified },
    { id: "ko", label: t.lang.korean },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />
      <div className="relative rounded-t-2xl bg-[#1C1C1E] pb-tab-safe">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
          <h3 className="text-base font-semibold">{t.settings.languageSheetTitle}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <ul className="divide-y divide-white/[0.06]">
          {options.map(({ id, label }) => (
            <li key={id}>
              <button
                type="button"
                onClick={() => {
                  setLocale(id);
                  onClose();
                }}
                className="flex w-full items-center justify-between px-4 py-4 text-left"
              >
                <span className="text-[15px]">{label}</span>
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full border-2",
                    locale === id
                      ? "border-accent-blue bg-accent-blue"
                      : "border-muted"
                  )}
                >
                  {locale === id && (
                    <span className="h-2 w-2 rounded-full bg-white" />
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
