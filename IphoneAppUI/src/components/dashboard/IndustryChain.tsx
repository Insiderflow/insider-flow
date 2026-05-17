import { Fragment } from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import type { IndustryChainNode, IndustryChainSegment, Period } from "@/data/mockData";
import {
  enrichIndustryChain,
  splitSegmentsIntoColumns,
} from "@/lib/industryChainModel";
import { useLanguage } from "@/i18n/LanguageContext";
import { getMessages } from "@/i18n/messages";

interface IndustryChainProps {
  nodes: IndustryChainNode[];
  period?: Period;
  className?: string;
  /** Tighter layout for the full-screen industry chain page */
  compact?: boolean;
}

function ColumnChevron({ compact }: { compact?: boolean }) {
  return (
    <ChevronRight
      className={cn(
        "shrink-0 self-center text-white/35",
        compact ? "mx-0 h-3.5 w-3.5" : "mx-0.5 h-4 w-4"
      )}
      aria-hidden
    />
  );
}

function SegmentNode({
  segment,
  label,
  compact,
}: {
  segment: IndustryChainSegment;
  label: string;
  compact?: boolean;
}) {
  const { tone, buyPct = 50 } = segment;
  const size = compact ? "h-8 w-8" : "h-10 w-10";

  const circleClass = cn(
    "relative shrink-0 rounded-full",
    size,
    tone === "buy" && "bg-buy",
    tone === "sell" && "bg-sell",
    tone === "neutral" && "border-2 border-white/30 bg-transparent"
  );

  const mixedStyle =
    tone === "mixed"
      ? {
          background: `conic-gradient(#22C55E 0% ${buyPct}%, #EF4444 ${buyPct}% 100%)`,
        }
      : undefined;

  return (
    <div
      className={cn(
        "flex w-full min-w-0 flex-col items-center",
        compact ? "gap-0.5" : "gap-1"
      )}
    >
      <motion.div
        className={circleClass}
        style={mixedStyle}
        whileTap={{ scale: 0.94 }}
      />
      <span
        className={cn(
          "w-full text-center font-medium leading-[1.15] text-white/70",
          compact ? "text-[7px] line-clamp-2" : "text-[8px] line-clamp-2"
        )}
      >
        {label}
      </span>
    </div>
  );
}

function IndustryCard({
  node,
  index,
  segmentLabel,
  compact,
}: {
  node: IndustryChainNode;
  index: number;
  segmentLabel: (key: string, fallback: string) => string;
  compact?: boolean;
}) {
  const buyAmount = node.buyAmount ?? 0;
  const sellAmount = node.sellAmount ?? 0;
  const segments = node.segments ?? [];
  const columns = splitSegmentsIntoColumns(segments);

  return (
    <motion.li
      initial={{ opacity: 0, y: compact ? 6 : 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: compact ? index * 0.03 : index * 0.05, duration: 0.25 }}
      className={cn(
        "glass-card overflow-hidden border border-white/[0.06] bg-surface-glass shadow-card",
        compact ? "rounded-2xl p-2.5" : "rounded-3xl p-3.5"
      )}
    >
      <div
        className={cn(
          "flex items-start justify-between gap-2",
          compact ? "mb-2" : "mb-3"
        )}
      >
        <h4
          className={cn(
            "min-w-0 flex-1 font-semibold leading-tight text-white",
            compact ? "text-[13px]" : "text-sm"
          )}
        >
          {node.name}
        </h4>
        <p
          className={cn(
            "shrink-0 text-right font-semibold tabular-nums leading-none",
            compact ? "text-[10px]" : "text-[11px]"
          )}
        >
          <span className="text-buy">{formatCurrency(buyAmount)}</span>
          <span className="mx-0.5 font-normal text-muted">/</span>
          <span className="text-sell">{formatCurrency(sellAmount)}</span>
        </p>
      </div>

      <div className="flex w-full items-center">
        {columns.map((col, colIndex) => (
          <Fragment key={colIndex}>
            {colIndex > 0 ? <ColumnChevron compact={compact} /> : null}
            <div
              className={cn(
                "flex min-w-0 flex-1 flex-col",
                compact ? "gap-1" : "gap-1.5"
              )}
            >
              {col.map((seg) => (
                <SegmentNode
                  key={seg.nameKey}
                  segment={seg}
                  label={segmentLabel(seg.nameKey, seg.name ?? seg.nameKey)}
                  compact={compact}
                />
              ))}
            </div>
          </Fragment>
        ))}
      </div>
    </motion.li>
  );
}

export default function IndustryChain({
  nodes,
  className,
  compact = false,
}: IndustryChainProps) {
  const { t, locale } = useLanguage();
  const m = getMessages(locale);
  const enriched = enrichIndustryChain(nodes);

  if (!enriched.length) return null;

  const segmentLabel = (key: string, fallback: string) =>
    m.mock.industries[key as keyof typeof m.mock.industries] ?? fallback ?? key;

  return (
    <section className={cn(compact ? "space-y-1.5" : "space-y-2.5", className)}>
      {!compact ? (
        <motion.div className="flex flex-wrap justify-end gap-x-3 gap-y-0.5 px-0.5 text-[8px] text-muted">
          <span className="flex items-center gap-0.5">
            <span className="h-2 w-2 rounded-full bg-buy" />
            {t.insiderProfile.industryChainLegendBuy}
          </span>
          <span className="flex items-center gap-0.5">
            <span className="h-2 w-2 rounded-full bg-sell" />
            {t.insiderProfile.industryChainLegendSell}
          </span>
          <span className="flex items-center gap-0.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{
                background: "conic-gradient(#22C55E 0% 50%, #EF4444 50% 100%)",
              }}
            />
            {t.insiderProfile.industryChainLegendMixed}
          </span>
        </motion.div>
      ) : null}

      <ul className={cn(compact ? "space-y-1.5" : "space-y-2")}>
        {enriched.map((node, index) => (
          <IndustryCard
            key={node.nameKey}
            node={node}
            index={index}
            segmentLabel={segmentLabel}
            compact={compact}
          />
        ))}
      </ul>
    </section>
  );
}
