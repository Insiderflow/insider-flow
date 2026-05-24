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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="brief-card"
    >
      <motion.div
        className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-flow/10 blur-3xl"
        animate={{ opacity: collapsed ? 0.15 : [0.35, 0.6, 0.35] }}
        transition={{ duration: 5, repeat: Infinity }}
      />
      <motion.div layout className="relative p-4">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-flow/15 ring-1 ring-flow/25">
            <Sparkles className="h-4 w-4 text-flow" />
          </span>
          <h2 className="text-xs font-bold uppercase tracking-wider text-flow">
            {t.aiSummary.title}
          </h2>
          <span
            className={cn(
              "rounded-pill px-2 py-0.5 text-[10px] font-bold",
              data.sentiment === "bullish" && "bg-buy-muted text-buy",
              data.sentiment === "bearish" && "bg-sell-muted text-sell",
              data.sentiment === "mixed" && "bg-flow/10 text-flow"
            )}
          >
            {sentimentLabel}
          </span>
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-expanded={!collapsed}
            className="ml-auto flex h-7 w-7 items-center justify-center rounded-lg text-muted transition-colors hover:bg-white/10 hover:text-white"
          >
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                collapsed && "-rotate-90"
              )}
            />
          </button>
        </div>

        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              key="content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="overflow-hidden"
            >
              <p className="mt-3 text-[15px] font-semibold leading-snug tracking-tight text-white">
                {data.headline}
              </p>
              {data.narrative ? (
                <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">
                  {data.narrative}
                </p>
              ) : data.bullets.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {data.bullets.map((b, i) => (
                    <li
                      key={i}
                      className="flex gap-2 text-xs leading-relaxed text-muted-foreground"
                    >
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-flow" />
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
