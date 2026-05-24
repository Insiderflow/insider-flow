import AISummary from "@/components/dashboard/AISummary";
import KpiCard from "@/components/dashboard/KpiCard";
import SectionHeader from "@/components/layout/SectionHeader";
import InsiderCompanyClusterCard from "./InsiderCompanyClusterCard";
import InsiderHighlightCard from "./InsiderHighlightCard";
import InsiderIndustrySection from "./InsiderIndustrySection";
import type { DashboardPayload, Period } from "@/data/mockData";
import { visibleInsiderDashboardKpis } from "@/lib/dashboardKpis";
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
    <div className="space-y-7">
      <AISummary data={data.aiSummary} />

      <section>
        <SectionHeader>{t.sections.overview}</SectionHeader>
        <div className="flex flex-wrap gap-2">
          {visibleInsiderDashboardKpis(data.kpis).map((kpi, i) => (
            <KpiCard key={kpi.id} item={kpi} index={i} />
          ))}
        </div>
      </section>

      <section>
        <SectionHeader>{t.insiderProfile.topClusterBuy}</SectionHeader>
        <div className="horizontal-scroll">
          {extras.companyClustersBuy.map((c) => (
            <InsiderCompanyClusterCard key={c.id} cluster={c} />
          ))}
        </div>
      </section>

      <section>
        <SectionHeader>{t.insiderProfile.topClusterSale}</SectionHeader>
        <div className="horizontal-scroll">
          {extras.companyClustersSell.map((c) => (
            <InsiderCompanyClusterCard key={c.id} cluster={c} />
          ))}
        </div>
      </section>

      <section>
        <SectionHeader>{t.insiderProfile.topInsiderBuy}</SectionHeader>
        <div className="horizontal-scroll">
          {extras.highlightsBuy.map((h) => (
            <InsiderHighlightCard key={h.id} item={h} />
          ))}
        </div>
      </section>

      <section>
        <SectionHeader>{t.insiderProfile.topInsiderSale}</SectionHeader>
        <div className="horizontal-scroll">
          {extras.highlightsSell.map((h) => (
            <InsiderHighlightCard key={h.id} item={h} />
          ))}
        </div>
      </section>

      <InsiderIndustrySection topIndustries={data.topIndustries} period={period} />
    </div>
  );
}
