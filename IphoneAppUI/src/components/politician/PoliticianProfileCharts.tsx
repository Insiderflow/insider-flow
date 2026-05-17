import type { PoliticianProfileCharts } from "@/data/insiderEntities";
import { formatCurrency } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";
import PoliticianTopIssuersChart from "./PoliticianTopIssuersChart";
import PoliticianMarketTrendChart from "./PoliticianMarketTrendChart";

interface PoliticianProfileChartsProps {
  name: string;
  charts: PoliticianProfileCharts;
}

function formatVolume(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `$${Math.round(n / 1000).toLocaleString("en-US")}K`;
  return formatCurrency(n);
}

function formatLastTrade(iso: string | null, locale: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(locale === "zh-Hans" ? "zh-CN" : "zh-TW", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function PoliticianProfileChartsSection({
  name,
  charts,
}: PoliticianProfileChartsProps) {
  const { t, locale } = useLanguage();
  const { stats } = charts;

  const statItems = [
    { value: String(stats.totalTrades), label: t.politicianProfile.tradeCount },
    { value: String(stats.issuerCount), label: t.politicianProfile.issuerCount },
    { value: formatVolume(stats.totalVolume), label: t.politicianProfile.totalVolume },
    { value: formatCurrency(stats.maxTrade), label: t.politicianProfile.maxTrade },
    {
      value: formatLastTrade(stats.lastTraded, locale),
      label: t.politicianProfile.lastTrade,
      wide: true,
    },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2">
        {statItems.map((item) => (
          <div
            key={item.label}
            className={`glass-card p-3 ${item.wide ? "col-span-2" : ""}`}
          >
            <p className="text-lg font-bold tabular-nums text-white">{item.value}</p>
            <p className="mt-0.5 text-[10px] text-muted">{item.label}</p>
          </div>
        ))}
      </div>

      <section>
        <h2 className="section-title mb-3 px-1">{t.politicianProfile.topIssuers}</h2>
        <div className="glass-card p-4">
          <PoliticianTopIssuersChart items={charts.topIssuers} />
        </div>
      </section>

      <section>
        <div className="glass-card p-4">
          <PoliticianMarketTrendChart name={name} points={charts.chartPoints} />
        </div>
      </section>
    </div>
  );
}
