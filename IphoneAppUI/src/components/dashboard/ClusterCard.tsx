import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { companyPathFromTicker } from "@/data/insiderEntities";
import { issuerProfilePath } from "@/data/issuerProfile";
import SpikeChart from "./SpikeChart";
import { cn, formatCurrency } from "@/lib/utils";
import type { ClusterItem, Party } from "@/data/mockData";
import { useDataMode } from "@/context/DataModeContext";
import { useLanguage } from "@/i18n/LanguageContext";

interface ClusterCardProps {
  cluster: ClusterItem;
  compact?: boolean;
}

function PartyBadge({ party }: { party: Party }) {
  return (
    <span
      className={cn(
        "flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold",
        party === "R" && "party-badge-r",
        party === "D" && "party-badge-d",
        party === "I" && "bg-zinc-500/20 text-zinc-400"
      )}
    >
      {party}
    </span>
  );
}

export default function ClusterCard({ cluster, compact }: ClusterCardProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { isInsider } = useDataMode();
  const isBuy = cluster.side === "buy";
  const insidersLabel = isInsider ? t.cluster.insidersCorporate : t.cluster.insiders;
  const ticker = cluster.tickers[0];

  const handleOpen = () => {
    const tk = (ticker || cluster.title || "").trim();
    if (isInsider) {
      if (!tk || tk === "—") return;
      navigate(companyPathFromTicker(tk));
      return;
    }
    if (cluster.issuerId) {
      navigate(issuerProfilePath(cluster.issuerId));
      return;
    }
    if (tk && tk !== "—") navigate(issuerProfilePath(tk));
  };

  return (
    <motion.article
      whileTap={{ scale: 0.98 }}
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={(e) => e.key === "Enter" && handleOpen()}
      className={cn(
        "cursor-pointer",
        "glass-card snap-card flex flex-col gap-2 p-3",
        compact ? "w-[168px]" : "w-[178px]",
        isBuy ? "shadow-glowBuy" : "shadow-glowSell"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {!isInsider && <PartyBadge party={cluster.party} />}
          <div>
            <h3 className="text-sm font-semibold leading-tight">{cluster.title}</h3>
            <p className="text-[10px] text-muted">{cluster.subtitle}</p>
          </div>
        </div>
        <SpikeChart
          data={cluster.spike}
          variant={isBuy ? "buy" : "sell"}
          width={64}
          height={26}
        />
      </div>
      <p className="text-[11px] text-muted-foreground">
        <span className="font-medium text-white/80">{cluster.insiders}</span>{" "}
        {insidersLabel}
        <span className="mx-1 text-border-strong">•</span>
        <span className="font-medium text-white/80">{cluster.trades}</span>{" "}
        {t.cluster.trades}
      </p>
      <p
        className={cn(
          "text-sm font-semibold tabular-nums",
          isBuy ? "text-buy" : "text-sell"
        )}
      >
        {formatCurrency(cluster.totalAmount)}
      </p>
      <div className="flex flex-wrap gap-1">
        {cluster.tickers.map((tk) => (
          <span
            key={tk}
            className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
          >
            {tk}
          </span>
        ))}
      </div>
    </motion.article>
  );
}
