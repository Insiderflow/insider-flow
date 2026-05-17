import { motion } from "framer-motion";
import { useLayoutEffect, useRef, useState } from "react";
import type { DashboardMeta, Period } from "@/data/mockData";
import { useHideOnScroll } from "@/lib/useHideOnScroll";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";
import DataModeToggle from "./DataModeToggle";
import LanguageToggle from "./LanguageToggle";
import PeriodToggle from "./PeriodToggle";

interface MobileHeaderProps {
  meta: DashboardMeta;
  period: Period;
  onPeriodChange: (p: Period) => void;
}

export default function MobileHeader({
  meta,
  period,
  onPeriodChange,
}: MobileHeaderProps) {
  const { t } = useLanguage();
  const headerVisible = useHideOnScroll();
  const innerRef = useRef<HTMLDivElement>(null);
  const [innerHeight, setInnerHeight] = useState(0);

  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;

    const measure = () => setInnerHeight(el.offsetHeight);
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [meta.dataAsOf, meta.nextUpdateEt, period, t.header.title]);

  return (
    <motion.div
      className={cn(
        "sticky top-0 z-30 -mx-4 overflow-hidden border-b border-border/80 bg-canvas/85 backdrop-blur-xl",
        !headerVisible && "pointer-events-none"
      )}
      initial={false}
      animate={{
        height: headerVisible ? innerHeight : 0,
        opacity: headerVisible ? 1 : 0,
      }}
      transition={{ duration: 0.26, ease: [0.4, 0, 0.2, 1] }}
    >
      <div ref={innerRef} className="px-4 pb-3 pt-safe">
        <div className="mb-2 flex items-center justify-between gap-2">
          <DataModeToggle />
          <LanguageToggle />
        </div>
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold tracking-tight">{t.header.title}</h1>
            <p className="mt-0.5 text-[11px] leading-snug text-muted">
              {t.header.dataAsOf} {meta.dataAsOf}
              <span className="mx-1 text-border-strong">•</span>
              {t.header.updatesAt} {meta.nextUpdateEt}
            </p>
          </div>
          <PeriodToggle value={period} onChange={onPeriodChange} />
        </div>
      </div>
    </motion.div>
  );
}
