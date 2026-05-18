import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import SpikeChart from "./SpikeChart";
import { cn, formatCurrency, formatShares } from "@/lib/utils";
import type { PoliticianTradeHighlight, Party, TradeSide } from "@/data/mockData";
import PoliticianAvatar from "@/components/politician/PoliticianAvatar";
import { useDataMode } from "@/context/DataModeContext";
import { useLanguage } from "@/i18n/LanguageContext";
import type { Messages } from "@/i18n/types";
import TradeFlagBadges from "@/components/trade/TradeFlagBadges";

interface PoliticianCardProps {
  trade: PoliticianTradeHighlight;
}

function PartyBadge({ party }: { party: Party }) {
  return (
    <span
      className={cn(
        "rounded-md px-1.5 py-0.5 text-[10px] font-bold",
        party === "R" && "party-badge-r",
        party === "D" && "party-badge-d"
      )}
    >
      {party}
    </span>
  );
}

function sideLabel(side: TradeSide, t: Messages) {
  if (side === "buy") return { text: t.trade.buy, variant: "buy" as const };
  if (side === "proposed_sale")
    return { text: t.trade.proposedSale, variant: "proposed" as const };
  return { text: t.trade.sell, variant: "sell" as const };
}

export default function PoliticianCard({ trade }: PoliticianCardProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { isPolitician } = useDataMode();
  const { text, variant } = sideLabel(trade.side, t);
  const profileId = trade.politicianId || trade.id;

  return (
    <motion.article
      whileTap={{ scale: 0.99 }}
      role="button"
      tabIndex={0}
      onClick={() => profileId && navigate(`/insider/person/${profileId}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && profileId) navigate(`/insider/person/${profileId}`);
      }}
      className="glass-card flex cursor-pointer gap-3 p-3"
    >
      {isPolitician ? (
        <PoliticianAvatar
          politicianId={profileId}
          name={trade.name}
          imageUrl={trade.imageUrl}
          party={trade.party}
          size="sm"
        />
      ) : (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-xs font-bold text-muted-foreground">
          {trade.state}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-semibold">{trade.name}</h3>
          {isPolitician && <PartyBadge party={trade.party} />}
          <div className="ml-auto flex flex-col items-end gap-1">
            <span
              className={cn(
                "text-[10px] font-semibold",
                variant === "buy" && "text-buy",
                variant === "sell" && "text-sell",
                variant === "proposed" && "text-proposed",
              )}
            >
              {text}
            </span>
            <TradeFlagBadges flags={trade.flags} max={1} />
          </div>
        </div>
        <p className="text-[11px] text-muted">
          {isPolitician ? `${trade.title} · ${trade.state}` : trade.title}
        </p>
        <div className="mt-1.5 flex items-end justify-between gap-2">
          <div>
            <p className="text-xs font-medium text-white/90">
              {trade.ticker}{" "}
              <span className="font-normal text-muted">· {trade.issuer}</span>
            </p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums">
              <span
                className={cn(
                  trade.side === "buy" && "text-buy",
                  trade.side === "sell" && "text-sell",
                  trade.side === "proposed_sale" && "text-proposed"
                )}
              >
                {formatCurrency(trade.amount)}
              </span>
              <span className="mx-1 text-muted">·</span>
              <span className="text-xs font-medium text-muted-foreground">
                {formatShares(
                  trade.shares,
                  isPolitician ? t.trade.approxAmount : undefined
                )}
              </span>
            </p>
          </div>
          <SpikeChart data={trade.spike} variant={variant} width={56} height={24} />
        </div>
        <p className="mt-1 text-[10px] text-muted">
          {isPolitician && trade.filedAt
            ? `${t.trade.publishedAt} ${trade.filedAt}`
            : trade.tradeDate}
        </p>
      </div>
    </motion.article>
  );
}
