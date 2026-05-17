import { motion } from "framer-motion";
import SpikeChart from "./SpikeChart";
import type { KpiItem } from "@/data/mockData";

interface KpiCardProps {
  item: KpiItem;
  index?: number;
}

const LABEL_VARIANT: Record<string, "buy" | "sell" | "proposed" | "neutral"> = {
  buys: "buy",
  sells: "sell",
  pp_sale: "proposed",
  options: "neutral",
};

export default function KpiCard({ item, index = 0 }: KpiCardProps) {
  const variant = LABEL_VARIANT[item.id] ?? "neutral";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="glass-card flex min-w-[calc(50%-6px)] flex-1 flex-col gap-2 p-3"
    >
      <div className="flex items-start justify-between gap-1">
        <span className="text-[11px] font-medium text-muted-foreground">{item.label}</span>
        <SpikeChart data={item.spike} variant={variant} width={56} height={22} />
      </div>
      <p className="text-xl font-semibold tabular-nums tracking-tight">
        {item.value.toLocaleString()}
      </p>
    </motion.div>
  );
}
