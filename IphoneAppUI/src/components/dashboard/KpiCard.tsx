import { motion } from "framer-motion";
import SpikeChart from "./SpikeChart";
import type { KpiItem } from "@/data/mockData";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  item: KpiItem;
  index?: number;
}

const TILE_CLASS: Record<string, string> = {
  buys: "kpi-tile--buy",
  sells: "kpi-tile--sell",
  plan_10b5: "kpi-tile--plan",
  options: "kpi-tile--neutral",
};

const SPIKE_VARIANT: Record<string, "buy" | "sell" | "plan" | "neutral"> = {
  buys: "buy",
  sells: "sell",
  plan_10b5: "plan",
  options: "neutral",
};

export default function KpiCard({ item, index = 0 }: KpiCardProps) {
  const tileClass = TILE_CLASS[item.id] ?? "kpi-tile--neutral";
  const spikeVariant = SPIKE_VARIANT[item.id] ?? "neutral";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn("kpi-tile flex flex-col gap-2", tileClass)}
    >
      <div className="flex items-start justify-between gap-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {item.label}
        </span>
        <SpikeChart data={item.spike} variant={spikeVariant} width={52} height={20} />
      </div>
      <p className="font-tabular text-2xl font-semibold text-white">
        {item.value.toLocaleString()}
      </p>
      {item.changePct !== 0 && (
        <p
          className={cn(
            "font-mono text-[10px] font-medium",
            item.changePct > 0 ? "text-buy" : "text-sell"
          )}
        >
          {item.changePct > 0 ? "+" : ""}
          {item.changePct.toFixed(1)}%
        </p>
      )}
    </motion.div>
  );
}
