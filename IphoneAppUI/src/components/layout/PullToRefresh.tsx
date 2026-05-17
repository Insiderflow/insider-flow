import { motion, useMotionValue, useTransform } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useCallback, useRef, useState, type ReactNode } from "react";
import { useLanguage } from "@/i18n/LanguageContext";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
}

export default function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const { t } = useLanguage();
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const y = useMotionValue(0);
  const opacity = useTransform(y, [0, 60], [0, 1]);
  const rotate = useTransform(y, [0, 60], [0, 180]);
  const hintY = useTransform(y, (v) => Math.min(v, 48) - 48);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
      y.set(0);
    }
  }, [onRefresh, y]);

  return (
    <div className="relative">
      <motion.div
        style={{ opacity, y: hintY }}
        className="pointer-events-none absolute left-0 right-0 top-0 z-20 flex justify-center pt-2"
      >
        <motion.div style={{ rotate }} className="pull-refresh-hint">
          <Loader2
            className={`h-4 w-4 ${refreshing ? "animate-spin text-accent-blue" : "text-muted"}`}
          />
          <span>{refreshing ? t.pullRefresh.refreshing : t.pullRefresh.hint}</span>
        </motion.div>
      </motion.div>

      <motion.div
        style={{ y }}
        onTouchStart={(e) => {
          if (window.scrollY <= 0) startY.current = e.touches[0].clientY;
        }}
        onTouchMove={(e) => {
          if (refreshing || window.scrollY > 0) return;
          const delta = e.touches[0].clientY - startY.current;
          if (delta > 0) y.set(Math.min(delta * 0.45, 72));
        }}
        onTouchEnd={async () => {
          if (y.get() > 52 && !refreshing) await handleRefresh();
          else y.set(0);
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
