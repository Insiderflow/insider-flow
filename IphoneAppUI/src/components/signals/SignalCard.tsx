import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import PoliticianAvatar from "@/components/politician/PoliticianAvatar";
import TradeFlagBadges from "@/components/trade/TradeFlagBadges";
import { useLanguage } from "@/i18n/LanguageContext";
import type { MobileSignalItem } from "@/api/endpoints";
import type { TradeFlagCode } from "@/types/tradeFlags";

interface SignalCardProps {
  signal: MobileSignalItem;
  index?: number;
}

export default function SignalCard({ signal, index = 0 }: SignalCardProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const flagLabels = signal.flags.map(
    (f) => t.tradeFlags[f as TradeFlagCode] || f,
  );
  const mlReasonLabels = (signal.mlReasons || []).map(
    (code) =>
      t.signalsPage.mlReason[code as keyof typeof t.signalsPage.mlReason] ||
      code,
  );
  const tierClass =
    signal.mlTier === "high"
      ? "bg-accent-purple/25 text-accent-purple"
      : signal.mlTier === "medium"
        ? "bg-amber-500/20 text-amber-400"
        : "bg-muted text-muted-foreground";

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      role="button"
      tabIndex={0}
      onClick={() =>
        navigate(`/issuer/${encodeURIComponent(signal.ticker)}`)
      }
      className="glass-card-elevated cursor-pointer p-4"
    >
      <motion.div className="flex items-start justify-between gap-2">
        <span className="text-xl font-bold tracking-tight">{signal.ticker}</span>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {signal.mlScore != null && (
            <span
              className={`rounded-md px-2 py-0.5 text-[10px] font-semibold tabular-nums ${tierClass}`}
              title={mlReasonLabels.join(" · ")}
            >
              {t.signalsPage.mlScore(signal.mlScore)} ·{" "}
              {t.signalsPage.mlTier[signal.mlTier]}
            </span>
          )}
          <TradeFlagBadges flags={signal.flags as TradeFlagCode[]} />
        </div>
      </motion.div>
      <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
        {t.signalsPage.headline(flagLabels, signal.ticker, signal.politicianName)}
      </p>
      {mlReasonLabels.length > 0 && (
        <p className="mt-1 line-clamp-1 text-[10px] text-muted-foreground/80">
          {mlReasonLabels.join(" · ")}
        </p>
      )}
      <div className="mt-3 flex items-center gap-2.5">
        <button
          type="button"
          className="shrink-0 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-purple"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/politician/${encodeURIComponent(signal.politicianId)}`);
          }}
        >
          <PoliticianAvatar
            politicianId={signal.politicianId}
            name={signal.politicianName}
            imageUrl={signal.imageUrl}
            party={signal.party}
            size="sm"
          />
        </button>
        <motion.div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{signal.politicianName}</p>
          <p className="text-xs text-muted-foreground">
            {signal.filedAt} · ${signal.amountUsd.toLocaleString()}
          </p>
        </motion.div>
      </div>
    </motion.article>
  );
}
