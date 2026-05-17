import { motion } from "framer-motion";
import PoliticianCard from "./PoliticianCard";
import type { PoliticianTradeHighlight } from "@/data/mockData";
import { useLanguage } from "@/i18n/LanguageContext";

interface TodaysPoliticianTradesProps {
  trades: PoliticianTradeHighlight[];
}

export default function TodaysPoliticianTrades({ trades }: TodaysPoliticianTradesProps) {
  const { t } = useLanguage();

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="space-y-3"
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="px-1"
      >
        <h2 className="section-title">{t.sections.industryTrends}</h2>
        <p className="mt-1 text-xs text-muted">
          {trades.length > 0 ? t.todaysTrades.count(trades.length) : t.todaysTrades.empty}
        </p>
        <p className="mt-0.5 text-[10px] text-muted/80">{t.todaysTrades.etNote}</p>
      </motion.div>

      {trades.length > 0 ? (
        <div className="space-y-2">
          {trades.map((trade) => (
            <PoliticianCard key={trade.id} trade={trade} />
          ))}
        </div>
      ) : (
        <div className="glass-card px-4 py-8 text-center text-sm text-muted">
          {t.todaysTrades.empty}
        </div>
      )}
    </motion.section>
  );
}
