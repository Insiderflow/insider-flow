import AISummary from "@/components/dashboard/AISummary";
import KpiCard from "@/components/dashboard/KpiCard";
import InsiderCompanyClusterCard from "./InsiderCompanyClusterCard";
import InsiderHighlightCard from "./InsiderHighlightCard";
import IndustryChainPreviewCard from "@/components/dashboard/IndustryChainPreviewCard";
import InsiderIndustrySection from "./InsiderIndustrySection";
import type { DashboardPayload, Period } from "@/data/mockData";
import { visibleDashboardKpis } from "@/lib/dashboardKpis";
import { useLanguage } from "@/i18n/LanguageContext";

interface InsiderDashboardProps {
  data: DashboardPayload;
  period: Period;
}

export default function InsiderDashboard({ data, period }: InsiderDashboardProps) {
  const { t } = useLanguage();
  const extras = data.insiderExtras;
  if (!extras) return null;

  return (
    <div className="space-y-6">
      <AISummary data={data.aiSummary} />

      <section>
        <h2 className="section-title mb-3 px-1">{t.sections.overview}</h2>
        <div className="flex flex-wrap gap-2">
          {visibleDashboardKpis(data.kpis).map((kpi, i) => (
            <KpiCard key={kpi.id} item={kpi} index={i} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="section-title mb-3 px-1">{t.insiderProfile.topClusterBuy}</h2>
        <div className="horizontal-scroll">
          {extras.companyClustersBuy.map((c) => (
            <InsiderCompanyClusterCard key={c.id} cluster={c} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="section-title mb-3 px-1">{t.insiderProfile.topClusterSale}</h2>
        <div className="horizontal-scroll">
          {extras.companyClustersSell.map((c) => (
            <InsiderCompanyClusterCard key={c.id} cluster={c} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="section-title mb-3 px-1">{t.insiderProfile.topInsiderBuy}</h2>
        <div className="horizontal-scroll">
          {extras.highlightsBuy.map((h) => (
            <InsiderHighlightCard key={h.id} item={h} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="section-title mb-3 px-1">{t.insiderProfile.topInsiderSale}</h2>
        <div className="horizontal-scroll">
          {extras.highlightsSell.map((h) => (
            <InsiderHighlightCard key={h.id} item={h} />
          ))}
        </div>
      </section>

      <IndustryChainPreviewCard nodes={data.industryChain} period={period} />

      <InsiderIndustrySection
        topIndustries={data.topIndustries}
        period={period}
      />
    </div>
  );
}
