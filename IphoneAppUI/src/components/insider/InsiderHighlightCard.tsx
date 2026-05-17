import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import SpikeChart from "@/components/dashboard/SpikeChart";
import { cn } from "@/lib/utils";
import {
  formatInsiderMoney,
  formatInsiderShares,
  highlightProfilePath,
  type InsiderHighlight,
} from "@/data/insiderEntities";

interface InsiderHighlightCardProps {
  item: InsiderHighlight;
}

export default function InsiderHighlightCard({ item }: InsiderHighlightCardProps) {
  const navigate = useNavigate();
  const isBuy = item.side === "buy";
  const path = highlightProfilePath(item);

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(path)}
      className={cn(
        "glass-card snap-card w-[168px] shrink-0 p-3 text-left",
        isBuy ? "border-buy/20" : "border-sell/20"
      )}
    >
      <p className="truncate text-sm font-semibold">{item.name}</p>
      <p className="mt-0.5 truncate text-[10px] text-muted">{item.subtitle}</p>
      <p
        className={cn(
          "mt-2 text-lg font-bold tabular-nums",
          isBuy ? "text-buy" : "text-sell"
        )}
      >
        {formatInsiderMoney(item.amount)}
      </p>
      <p className="text-[11px] text-muted-foreground">
        {formatInsiderShares(item.shares)}
      </p>
      <div className="mt-2 flex justify-end">
        <SpikeChart
          data={item.spike}
          variant={isBuy ? "buy" : "sell"}
          width={72}
          height={24}
        />
      </div>
    </motion.button>
  );
}
