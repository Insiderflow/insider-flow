import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Sparkles } from "lucide-react";
import type { AISummaryData } from "@/data/mockData";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";

interface ProfileAISummaryCardProps {
  data: AISummaryData;
  dataAsOf: string;
}

export default function ProfileAISummaryCard({
  data,
  dataAsOf,
}: ProfileAISummaryCardProps) {
  const { t } = useLanguage();
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div className="glass-card overflow-hidden p-4">
      <motion.div layout className="flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/8">
          <Sparkles className="h-4 w-4 text-accent-purple" />
        </span>
        <h3 className="text-sm font-semibold">{t.aiSummary.title}</h3>
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-expanded={!collapsed}
          aria-label={collapsed ? t.aiSummary.expand : t.aiSummary.collapse}
          className="ml-auto flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-muted transition-colors hover:bg-white/10 hover:text-white"
        >
          {t.insiderProfile.asOf(dataAsOf)}
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 transition-transform duration-200",
              !collapsed && "rotate-180"
            )}
          />
        </button>
      </motion.div>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <p className="mt-3 text-sm font-medium leading-snug text-white/95">
              {data.headline}
            </p>
            <ul className="mt-2 space-y-1.5">
              {data.bullets.map((b, i) => (
                <li
                  key={i}
                  className="flex gap-2 text-xs leading-relaxed text-muted-foreground"
                >
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent-purple" />
                  {b}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
