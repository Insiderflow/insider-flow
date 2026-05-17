import { motion } from "framer-motion";
import IndustryChain from "./IndustryChain";
import TopIndustriesBar from "./TopIndustriesBar";
import type { IndustryChainNode, IndustryBarItem } from "@/data/mockData";
import { useLanguage } from "@/i18n/LanguageContext";

interface IndustryTrendCardProps {
  industryChain: IndustryChainNode[];
  topIndustries: IndustryBarItem[];
}

export default function IndustryTrendCard({
  industryChain,
  topIndustries,
}: IndustryTrendCardProps) {
  const { t } = useLanguage();

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="space-y-4"
    >
      <h2 className="section-title px-1">{t.sections.industryTrends}</h2>
      <motion.div className="glass-card space-y-5 p-4">
        {industryChain.length > 0 ? (
          <>
            <IndustryChain nodes={industryChain} />
            <div className="h-px bg-border" />
          </>
        ) : null}
        <TopIndustriesBar items={topIndustries} />
      </motion.div>
    </motion.section>
  );
}
