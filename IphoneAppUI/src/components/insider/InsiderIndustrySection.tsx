import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import type { IndustryBarItem, Period } from "@/data/mockData";
import { useLanguage } from "@/i18n/LanguageContext";

interface InsiderIndustrySectionProps {
  topIndustries: IndustryBarItem[];
  period: Period;
}

export default function InsiderIndustrySection({
  topIndustries,
  period,
}: InsiderIndustrySectionProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [industryTab, setIndustryTab] = useState<"buy" | "sell">("buy");

  const sortedIndustries = [...topIndustries]
    .map((item) => {
      const buyVol = Math.max(0, item.buyAmount);
      const sellVol = Math.max(0, item.sellAmount);
      const buyCount = item.buyCount ?? 0;
      const sellCount = item.sellCount ?? 0;
      const sideAmount = industryTab === "buy" ? buyVol : sellVol;
      const sideCount = industryTab === "buy" ? buyCount : sellCount;
      const txTotal = buyCount + sellCount;
      const totalVol = buyVol + sellVol || 1;
      const pct = Math.round((sideAmount / totalVol) * 100);
      return { item, sideAmount, sideCount, txTotal, pct };
    })
    .filter((row) => row.sideAmount > 0)
    .sort((a, b) => b.sideAmount - a.sideAmount);

  const goToIndustryCompare = (nameKey: string) => {
    navigate(
      `/industry-compare?sector=${encodeURIComponent(nameKey)}&side=${encodeURIComponent(industryTab)}&period=${encodeURIComponent(period)}`
    );
  };

  return (
    <section className="space-y-4">
      <h2 className="section-title px-1">{t.sections.industryTrends}</h2>

      {sortedIndustries.length > 0 && (
        <div>
          <h3 className="mb-2 px-1 text-xs font-semibold text-white/80">
            {t.insiderProfile.topIndustries}
          </h3>
          <div className="mb-3 flex border-b border-border">
            {(["buy", "sell"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setIndustryTab(tab)}
                className={cn(
                  "relative flex-1 pb-2 text-sm font-medium",
                  industryTab === tab ? "text-white" : "text-muted"
                )}
              >
                {tab === "buy" ? t.insiderProfile.topBuyTab : t.insiderProfile.topSellTab}
                {industryTab === tab && (
                  <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-white" />
                )}
              </button>
            ))}
          </div>
          <ul className="space-y-2">
            {sortedIndustries.slice(0, 5).map(({ item, sideAmount, sideCount, txTotal, pct }) => (
              <li key={item.nameKey}>
                <button
                  type="button"
                  onClick={() => goToIndustryCompare(item.nameKey)}
                  className="glass-card flex w-full items-center gap-3 p-3 text-left"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-xs font-bold">
                    {item.name.slice(0, 3)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{item.name}</p>
                    <p className="text-[10px] text-muted">
                      {formatCurrency(sideAmount)}
                      {txTotal > 0
                        ? ` · ${
                            industryTab === "buy"
                              ? t.insiderProfile.buysOf(sideCount, txTotal)
                              : t.insiderProfile.sellsOf(sideCount, txTotal)
                          }`
                        : null}
                    </p>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-pill bg-white/10">
                      <div
                        className={cn(
                          "h-full rounded-pill",
                          industryTab === "buy" ? "bg-buy" : "bg-sell"
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">{pct}%</span>
                  <ChevronRight className="h-4 w-4 text-muted" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
