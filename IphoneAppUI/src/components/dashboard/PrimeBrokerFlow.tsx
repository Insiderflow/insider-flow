import SpikeChart from "./SpikeChart";
import { cn, formatCurrency } from "@/lib/utils";
import type { PrimeBrokerItem } from "@/data/mockData";
import { useLanguage } from "@/i18n/LanguageContext";

interface PrimeBrokerFlowProps {
  items: PrimeBrokerItem[];
}

export default function PrimeBrokerFlow({ items }: PrimeBrokerFlowProps) {
  const { t } = useLanguage();

  return (
    <div>
      <h3 className="mb-3 text-xs font-semibold text-white/80">
        {t.industry.primeBrokerFlow}
      </h3>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{item.name}</p>
              <p
                className={cn(
                  "text-xs font-semibold tabular-nums",
                  item.direction === "inflow" ? "text-buy" : "text-sell"
                )}
              >
                {item.direction === "inflow" ? "+" : "−"}
                {formatCurrency(item.flowAmount)}
              </p>
            </div>
            <SpikeChart
              data={item.spike}
              variant={
                item.direction === "inflow"
                  ? "buy"
                  : item.direction === "outflow"
                    ? "sell"
                    : "neutral"
              }
              width={72}
              height={28}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
