import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import type { IndustryChainNode, Period } from "@/data/mockData";
import { resolveChainAmounts } from "@/lib/industryChainModel";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn, formatCurrency } from "@/lib/utils";

interface IndustryChainPreviewCardProps {
  nodes: IndustryChainNode[];
  period: Period;
  className?: string;
}

function toneDotClass(buyPct: number, sellPct: number) {
  if (buyPct > 22 && sellPct > 22) return "bg-gradient-to-br from-buy to-sell";
  if (buyPct >= sellPct) return "bg-buy";
  if (sellPct > buyPct) return "bg-sell";
  return "bg-white/15";
}

export default function IndustryChainPreviewCard({
  nodes,
  period,
  className,
}: IndustryChainPreviewCardProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();

  if (!nodes.length) return null;

  const preview = nodes.slice(0, 3);
  const top = [...nodes].sort(
    (a, b) =>
      resolveChainAmounts(b).buyAmount +
      resolveChainAmounts(b).sellAmount -
      (resolveChainAmounts(a).buyAmount + resolveChainAmounts(a).sellAmount)
  )[0];
  const topAmounts = top ? resolveChainAmounts(top) : { buyAmount: 0, sellAmount: 0 };

  const open = () => {
    navigate(`/industry-chain?period=${encodeURIComponent(period)}`);
  };

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.98 }}
      onClick={open}
      className={cn("panel-card w-full p-4 text-left transition-colors hover:border-flow/25", className)}
    >
      <motion.div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold text-white">
            {t.industry.industryChain}
          </p>
          <p className="mt-1 text-xs text-muted">
            {t.industryChainPage.industryCount(nodes.length, period)}
          </p>
        </div>
        <ChevronRight className="mt-0.5 h-5 w-5 shrink-0 text-muted" />
      </motion.div>

      <div className="mt-3 flex items-center gap-2">
        {preview.map((node) => (
          <span
            key={node.nameKey}
            className={cn(
              "h-7 w-7 shrink-0 rounded-lg ring-1 ring-white/10",
              toneDotClass(node.buyPct, node.sellPct)
            )}
            title={node.name}
          />
        ))}
        {nodes.length > 3 ? (
          <span className="text-[10px] font-medium text-muted">
            +{nodes.length - 3}
          </span>
        ) : null}
      </div>

      {top ? (
        <p className="mt-3 text-[11px] leading-snug text-muted-foreground">
          <span className="text-white/90">{top.name}</span>
          <span className="mx-1 text-muted">·</span>
          <span className="text-buy">{formatCurrency(topAmounts.buyAmount)}</span>
          <span className="mx-1 text-muted">/</span>
          <span className="text-sell">{formatCurrency(topAmounts.sellAmount)}</span>
        </p>
      ) : null}
    </motion.button>
  );
}
