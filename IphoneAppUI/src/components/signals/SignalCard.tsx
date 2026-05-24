import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import PoliticianAvatar from "@/components/politician/PoliticianAvatar";
import TradeFlagBadges from "@/components/trade/TradeFlagBadges";
import { resolveSignalRecommendation } from "@/lib/signalRecommendation";
import SignalSideBadge, { tradeSideLabel } from "@/components/signals/SignalSideBadge";
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
  const isCorporate = signal.feed === "corporate";
  const recommendation = resolveSignalRecommendation(signal);
  const profilePath = isCorporate
    ? signal.ownerId
      ? `/insider/person/person-${signal.ownerId}`
      : signal.politicianId
        ? `/insider/person/${signal.politicianId}`
        : null
    : signal.politicianId
      ? `/politician/${encodeURIComponent(signal.politicianId)}`
      : null;
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
      onClick={() => navigate(`/signals/${encodeURIComponent(signal.id)}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigate(`/signals/${encodeURIComponent(signal.id)}`);
        }
      }}
      className="trade-row-card cursor-pointer p-4"
    >
      <motion.div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className="font-mono text-xl font-bold tracking-tight text-flow">
            {signal.ticker}
          </span>
          <span className="ml-1.5 rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {t.signalsPage.feedBadge[signal.feed]}
          </span>
        </div>
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
        {(isCorporate ? t.signalsPage.insiderHeadline : t.signalsPage.headline)(
          flagLabels,
          signal.ticker,
          signal.politicianName,
        )}
      </p>
      {mlReasonLabels.length > 0 && (
        <p className="mt-1 line-clamp-1 text-[10px] text-muted-foreground/80">
          {mlReasonLabels.join(" · ")}
        </p>
      )}
      <div className="mt-3 flex items-center gap-2.5">
        {profilePath ? (
          <button
            type="button"
            className="shrink-0 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-purple"
            onClick={(e) => {
              e.stopPropagation();
              navigate(profilePath);
            }}
          >
            <PoliticianAvatar
              politicianId={isCorporate ? undefined : signal.politicianId}
              name={signal.politicianName}
              imageUrl={signal.imageUrl}
              party={isCorporate ? undefined : signal.party}
              size="sm"
            />
          </button>
        ) : (
          <PoliticianAvatar
            politicianId={isCorporate ? undefined : signal.politicianId}
            name={signal.politicianName}
            imageUrl={signal.imageUrl}
            party={isCorporate ? undefined : signal.party}
            size="sm"
          />
        )}
        <motion.div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{signal.politicianName}</p>
          <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <SignalSideBadge recommendation={recommendation} />
            <span className="text-[10px] text-muted-foreground/70">
              {t.signalsPage.filingLabel(tradeSideLabel(signal.side, t))}
            </span>
            <span aria-hidden>·</span>
            <span>{signal.filedAt}</span>
            <span aria-hidden>·</span>
            <span>${signal.amountUsd.toLocaleString()}</span>
          </p>
        </motion.div>
      </div>
    </motion.article>
  );
}
