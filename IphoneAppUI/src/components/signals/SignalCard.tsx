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
      <div className="flex items-start justify-between gap-2">
        <span className="text-xl font-bold tracking-tight">{signal.ticker}</span>
        <TradeFlagBadges flags={signal.flags as TradeFlagCode[]} />
      </div>
      <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
        {t.signalsPage.headline(flagLabels, signal.ticker, signal.politicianName)}
      </p>
      <div className="mt-3 flex items-center gap-2.5">
        <PoliticianAvatar
          politicianId={signal.politicianId}
          name={signal.politicianName}
          imageUrl={signal.imageUrl}
          party={signal.party}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{signal.politicianName}</p>
          <p className="text-xs text-muted-foreground">
            {signal.filedAt} · ${signal.amountUsd.toLocaleString()}
          </p>
        </div>
      </div>
    </motion.article>
  );
}
