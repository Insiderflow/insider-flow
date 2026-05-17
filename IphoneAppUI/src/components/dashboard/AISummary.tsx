import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Sparkles } from "lucide-react";
import type { AISummaryData } from "@/data/mockData";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";

interface AISummaryProps {
  data: AISummaryData;
}

export default function AISummary({ data }: AISummaryProps) {
  const { t } = useLanguage();
  const [collapsed, setCollapsed] = useState(false);

  const sentimentLabel =
    data.sentiment === "bullish"
      ? t.sentiment.bullish
      : data.sentiment === "bearish"
        ? t.sentiment.bearish
        : t.sentiment.mixed;

  return (
    <motion.section
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative overflow-hidden rounded-card border border-accent-purple/30 bg-gradient-to-br from-accent-purple/20 via-surface-elevated to-canvas shadow-card"
    >
      <motion.div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-accent-purple/20 blur-3xl"
        animate={{ opacity: collapsed ? 0.2 : [0.4, 0.7, 0.4] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
      <motion.div layout className="relative p-4">
        <motion.div layout className="flex items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent-purple/30">
            <Sparkles className="h-4 w-4 text-accent-purple" />
          </span>
          <h2 className="text-sm font-semibold tracking-tight">{t.aiSummary.title}</h2>
          <span
            className={cn(
              "rounded-pill px-2 py-0.5 text-[10px] font-medium",
              data.sentiment === "bullish" && "bg-buy-muted text-buy",
              data.sentiment === "bearish" && "bg-sell-muted text-sell",
              data.sentiment === "mixed" && "bg-proposed-muted text-proposed"
            )}
          >
            {sentimentLabel}
          </span>
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-expanded={!collapsed}
            aria-label={collapsed ? t.aiSummary.expand : t.aiSummary.collapse}
            className="ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-white/10 hover:text-white"
          >
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                collapsed && "-rotate-90"
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
              <p className="mt-3 text-[15px] font-medium leading-snug text-white/95">
                {data.headline}
              </p>
              {data.narrative ? (
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  {data.narrative}
                </p>
              ) : data.bullets.length > 0 ? (
                <ul className="mt-3 space-y-2">
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
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.section>
  );
}
