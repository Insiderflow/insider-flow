import type { IndustryBarItem } from "@/data/mockData";
import { formatCurrency } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";

interface TopIndustriesBarProps {
  items: IndustryBarItem[];
}

export default function TopIndustriesBar({ items }: TopIndustriesBarProps) {
  const { t } = useLanguage();
  const maxTotal = Math.max(
    ...items.map((i) => i.buyAmount + i.sellAmount),
    1
  );

  return (
    <div>
      <h3 className="mb-3 text-xs font-semibold text-white/80">
        {t.industry.topIndustries}
      </h3>
      <ul className="space-y-3">
        {items.map((item) => {
          const total = item.buyAmount + item.sellAmount;
          const buyW = (item.buyAmount / maxTotal) * 100;
          const sellW = (item.sellAmount / maxTotal) * 100;
          return (
            <li key={item.nameKey}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="font-medium">{item.name}</span>
                <span className="text-muted tabular-nums">
                  {formatCurrency(total)}
                </span>
              </div>
              <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-md">
                <div
                  className="rounded-l-md bg-buy"
                  style={{ width: `${buyW}%` }}
                />
                <div
                  className="rounded-r-md bg-sell"
                  style={{ width: `${sellW}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
