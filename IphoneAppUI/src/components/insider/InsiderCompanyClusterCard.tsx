import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Users } from "lucide-react";
import SpikeChart from "@/components/dashboard/SpikeChart";
import { cn } from "@/lib/utils";
import {
  clusterCompanyPath,
  type InsiderCompanyCluster,
} from "@/data/insiderEntities";
import { useLanguage } from "@/i18n/LanguageContext";

interface InsiderCompanyClusterCardProps {
  cluster: InsiderCompanyCluster;
}

export default function InsiderCompanyClusterCard({
  cluster,
}: InsiderCompanyClusterCardProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const isBuy = cluster.side === "buy";

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(clusterCompanyPath(cluster))}
      className={cn(
        "snap-card flex w-[196px] flex-col gap-2.5 rounded-panel border bg-surface-elevated/90 p-3.5 text-left",
        isBuy ? "border-buy/20 shadow-glowBuy" : "border-sell/20 shadow-glowSell"
      )}
    >
      <div className="flex items-center gap-2.5">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-mono text-xs font-bold text-white ring-1 ring-white/10"
          style={{ backgroundColor: cluster.logoColor }}
        >
          {cluster.ticker.slice(0, 2)}
        </span>
        <div className="min-w-0">
          <p className="font-mono text-sm font-bold text-flow">{cluster.ticker}</p>
          <p className="truncate text-[10px] text-muted">{cluster.companyName}</p>
        </div>
      </div>
      <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <Users className="h-3 w-3 text-flow" />
        {cluster.insiders} {t.cluster.insidersCorporate} · {cluster.trades}{" "}
        {t.cluster.trades}
      </p>
      <div className="flex items-end justify-between">
        <SpikeChart
          data={cluster.spike}
          variant={isBuy ? "buy" : "sell"}
          width={100}
          height={28}
        />
        <span
          className={cn(
            "h-2 w-2 rounded-full ring-2 ring-offset-1 ring-offset-surface-elevated",
            isBuy ? "bg-buy ring-buy/30" : "bg-sell ring-sell/30"
          )}
        />
      </div>
    </motion.button>
  );
}
