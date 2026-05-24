import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import PoliticianAvatar from "@/components/politician/PoliticianAvatar";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";
import type { LiveTrade } from "@/data/liveMockData";
import type { TradeSide } from "@/data/mockData";
import TradeFlagBadges from "@/components/trade/TradeFlagBadges";

interface LiveTradeCardProps {
  trade: LiveTrade;
  index?: number;
}

function sideDotClass(side: TradeSide) {
  if (side === "buy") return "bg-buy shadow-[0_0_8px_rgba(34,197,94,0.6)]";
  if (side === "proposed_sale") return "bg-proposed shadow-[0_0_8px_rgba(249,115,22,0.5)]";
  return "bg-sell shadow-[0_0_8px_rgba(239,68,68,0.6)]";
}

function metricColor(trade: LiveTrade) {
  if (trade.metricLabel === "outstanding") return "text-proposed";
  if (trade.metricPositive === true) return "text-buy";
  if (trade.metricPositive === false) return "text-sell";
  return "text-white/90";
}

export default function LiveTradeCard({ trade, index = 0 }: LiveTradeCardProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const metricLabel =
    trade.metricLabel === "outstanding" ? t.live.outstanding : t.live.holdings;

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      whileTap={{ scale: 0.995 }}
      role={trade.profilePath ? "button" : undefined}
      tabIndex={trade.profilePath ? 0 : undefined}
      onClick={() => trade.profilePath && navigate(trade.profilePath)}
      className={cn(
        "panel-card overflow-hidden p-4",
        trade.profilePath && "cursor-pointer",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-xl font-bold tracking-tight text-flow">
          {trade.ticker}
        </span>
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-white/8 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
              {trade.disclosureBadge}
            </span>
            <span
              className={cn("h-2.5 w-2.5 shrink-0 rounded-full", sideDotClass(trade.side))}
            />
          </div>
          <TradeFlagBadges flags={trade.flags} className="justify-end" />
        </div>
      </div>

      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-2.5">
          {trade.showParty && trade.politicianId && (
            <PoliticianAvatar
              politicianId={trade.politicianId}
              name={trade.displayName}
              imageUrl={trade.imageUrl}
              party={trade.party}
              size="sm"
            />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-2">
              <p className="truncate text-[15px] font-semibold leading-tight">
                {trade.displayName}
              </p>
              {trade.showParty && trade.party && (
                <span
                  className={cn(
                    "shrink-0 text-[9px] font-bold",
                    trade.party === "R" && "text-red-400",
                    trade.party === "D" && "text-blue-400",
                  )}
                >
                  {trade.party}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-muted">{trade.title}</p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[10px] text-muted">{metricLabel}</p>
          <p className={cn("text-sm font-semibold tabular-nums", metricColor(trade))}>
            {trade.metricValue}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <DataPill label={t.live.filed} value={trade.filedDisplay} />
        <DataPill label={t.live.price} value={trade.priceDisplay} />
        <DataPill label={t.live.totalValue} value={trade.totalValueDisplay} highlight />
      </div>
    </motion.article>
  );
}

function DataPill({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="live-data-pill rounded-lg px-2 py-2">
      <p className="text-[10px] text-muted">{label}</p>
      <p
        className={cn(
          "mt-0.5 truncate text-xs font-semibold tabular-nums",
          highlight ? "text-white" : "text-white/90",
        )}
      >
        {value}
      </p>
    </div>
  );
}
