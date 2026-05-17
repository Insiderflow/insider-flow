import { Info } from "lucide-react";
import DataModeToggle from "@/components/layout/DataModeToggle";
import LanguageToggle from "@/components/layout/LanguageToggle";
import { useLanguage } from "@/i18n/LanguageContext";

export default function LivePageHeader() {
  const { t } = useLanguage();

  return (
    <header className="pt-safe">
      <div className="relative flex min-h-[44px] items-center justify-center px-4 py-3">
        <div className="absolute left-4 top-1/2 -translate-y-1/2">
          <DataModeToggle />
        </div>
        <h1 className="text-lg font-semibold tracking-tight">{t.live.pageTitle}</h1>
        <div className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-2">
          <LanguageToggle />
          <button
            type="button"
            aria-label={t.live.infoAria}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/5 hover:text-white"
          >
            <Info className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
