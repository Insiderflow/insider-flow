import { useLanguage } from "@/i18n/LanguageContext";

interface MobilePlaceholderProps {
  tab: "search" | "settings";
}

export default function MobilePlaceholder({ tab }: MobilePlaceholderProps) {
  const { t } = useLanguage();
  const title = tab === "search" ? t.tabs.search : t.tabs.settings;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center pb-tab-safe pt-safe">
      <p className="text-lg font-semibold text-white/80">{title}</p>
      <p className="mt-2 text-sm text-muted">Coming soon</p>
    </div>
  );
}
