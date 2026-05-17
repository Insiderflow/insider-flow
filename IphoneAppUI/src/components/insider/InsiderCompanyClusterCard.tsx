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
        "glass-card snap-card flex w-[200px] flex-col gap-2 p-3 text-left",
        isBuy ? "shadow-glowBuy" : "shadow-glowSell"
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
          style={{ backgroundColor: cluster.logoColor }}
        >
          {cluster.ticker.slice(0, 2)}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold">{cluster.ticker}</p>
          <p className="truncate text-[10px] text-muted">{cluster.companyName}</p>
        </div>
      </div>
      <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <Users className="h-3 w-3" />
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
            "h-2 w-2 rounded-full",
            isBuy ? "bg-buy" : "bg-sell"
          )}
        />
      </div>
    </motion.button>
  );
}
