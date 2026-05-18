import * as Collapsible from "@radix-ui/react-collapsible";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn, formatCurrency } from "@/lib/utils";
import type { RecentTrade, Party, TradeSide } from "@/data/mockData";
import { useLanguage } from "@/i18n/LanguageContext";
import TradeFlagBadges from "@/components/trade/TradeFlagBadges";

interface RecentTradesTimelineProps {
  trades: RecentTrade[];
}

function PartyDot({ party }: { party: Party }) {
  return (
    <span
      className={cn(
        "text-[9px] font-bold",
        party === "R" && "text-red-400",
        party === "D" && "text-blue-400"
      )}
    >
      {party}
    </span>
  );
}

function sideColor(side: TradeSide) {
  if (side === "buy") return "text-buy bg-buy-muted";
  if (side === "proposed_sale") return "text-proposed bg-proposed-muted";
  return "text-sell bg-sell-muted";
}

export default function RecentTradesTimeline({ trades }: RecentTradesTimelineProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const visible = open ? trades : trades.slice(0, 4);

  const sideLabel = (side: TradeSide) => {
    if (side === "buy") return t.trade.buy;
    if (side === "proposed_sale") return t.trade.proposedShort;
    return t.trade.sell;
  };

  return (
    <Collapsible.Root open={open} onOpenChange={setOpen}>
      <section className="glass-card overflow-hidden">
        <Collapsible.Trigger className="flex w-full items-center justify-between p-4 text-left">
          <div>
            <h2 className="section-title">{t.recentTrades.title}</h2>
            <p className="mt-1 text-xs text-muted">
              {t.recentTrades.filingsToday(trades.length)}
            </p>
          </div>
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5"
          >
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </motion.span>
        </Collapsible.Trigger>

        <Collapsible.Content>
          <ul className="relative border-t border-border px-4 pb-4 pt-2">
            <div className="absolute bottom-4 left-[23px] top-2 w-px bg-border" />
            <AnimatePresence initial={false}>
              {visible.map((tr, i) => (
                <motion.li
                  key={tr.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.03 }}
                  role={tr.politicianId ? "button" : undefined}
                  tabIndex={tr.politicianId ? 0 : undefined}
                  onClick={() =>
                    tr.politicianId && navigate(`/insider/person/${tr.politicianId}`)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && tr.politicianId) {
                      navigate(`/insider/person/${tr.politicianId}`);
                    }
                  }}
                  className={cn(
                    "relative flex gap-3 py-2.5 pl-1",
                    tr.politicianId && "cursor-pointer"
                  )}
                >
                  <span
                    className={cn(
                      "relative z-10 mt-1 flex h-3 w-3 shrink-0 rounded-full ring-2 ring-surface-elevated",
                      tr.side === "buy" && "bg-buy",
                      tr.side === "sell" && "bg-sell",
                      tr.side === "proposed_sale" && "bg-proposed"
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">{tr.politician}</span>
                      <PartyDot party={tr.party} />
                      <span className="ml-auto text-[10px] text-muted">{tr.filedAt}</span>
                    </div>
                    <motion.div className="mt-0.5 flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold">{tr.ticker}</span>
                      <span
                        className={cn(
                          "rounded-pill px-1.5 py-0.5 text-[10px] font-semibold",
                          sideColor(tr.side),
                        )}
                      >
                        {sideLabel(tr.side)}
                      </span>
                      <TradeFlagBadges flags={tr.flags} max={2} />
                      <span className="ml-auto text-xs font-medium tabular-nums text-white/90">
                        {formatCurrency(tr.amount)}
                      </span>
                    </motion.div>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
          {!open && trades.length > 4 && (
            <p className="border-t border-border px-4 py-2 text-center text-xs text-accent-blue">
              {t.recentTrades.showMore(trades.length - 4)}
            </p>
          )}
        </Collapsible.Content>
      </section>
    </Collapsible.Root>
  );
}
