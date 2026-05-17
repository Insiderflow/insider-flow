import type { DashboardPayload } from '@/data/mockData';
import { industryName } from '@/data/mockData';
import { enrichIndustryChain } from '@/lib/industryChainModel';
import { normalizePrimeBrokers } from '@/lib/normalizePrimeBrokers';
import { localizePoliticianSeatTitle } from '@/lib/politicianSectorLabel';
import type { Locale } from '@/i18n/types';
import { getMessages } from '@/i18n/messages';

function localizeAiSummary(
  data: DashboardPayload,
  locale: Locale,
  m: ReturnType<typeof getMessages>
): DashboardPayload['aiSummary'] {
  if (data.aiSummary.narrative) return data.aiSummary;

  const stats = data.aiSummary.stats;
  if (!stats) return data.aiSummary;

  const sectorLabel = stats.topSectorKey
    ? m.mock.industries[stats.topSectorKey] ??
      industryName(locale, stats.topSectorKey)
    : null;

  return {
    ...data.aiSummary,
    headline: m.dashboardAi.headline(stats.buysCount, stats.sellsCount, stats.period),
    bullets: [
      stats.buysToday > 0
        ? m.dashboardAi.buysToday(stats.buysToday)
        : m.dashboardAi.buysTodayNone,
      sectorLabel ? m.dashboardAi.sectorLeads(sectorLabel) : m.dashboardAi.sectorMixed,
    ],
  };
}

/** Apply locale strings to API dashboard payload. */
export function localizeDashboard(
  data: DashboardPayload,
  locale: Locale
): DashboardPayload {
  const m = getMessages(locale);
  const disclosureAsOf = data.meta.latestDisclosureAt?.slice(0, 10) ?? data.meta.dataAsOf;

  return {
    ...data,
    aiSummary: localizeAiSummary(data, locale, m),
    meta: {
      dataAsOf: disclosureAsOf,
      nextUpdateEt: m.mock.meta.nextUpdateEt,
      generatedAt: data.meta.generatedAt,
      latestDisclosureAt: data.meta.latestDisclosureAt,
    },
    kpis: data.kpis.map((k) => {
      const labelMap: Record<string, string> = {
        buys: m.kpi.buys,
        sells: m.kpi.sells,
        options: m.kpi.options,
        pp_sale: m.kpi.ppSale,
      };
      return { ...k, label: labelMap[k.id] ?? k.label };
    }),
    industryChain: enrichIndustryChain(
      data.industryChain.map((n) => ({
        ...n,
        name: m.mock.industries[n.nameKey] ?? n.name ?? industryName(locale, n.nameKey),
        segments: n.segments?.map((s) => ({
          ...s,
          name: m.mock.industries[s.nameKey] ?? s.name ?? industryName(locale, s.nameKey),
        })),
      }))
    ),
    topIndustries: data.topIndustries.map((n) => ({
      ...n,
      name: m.mock.industries[n.nameKey] ?? n.name ?? industryName(locale, n.nameKey),
    })),
    topPoliticianBuys: data.topPoliticianBuys.map((p) => ({
      ...p,
      title: localizePoliticianSeatTitle(m, p.title, p.titleKey),
    })),
    topPoliticianSells: data.topPoliticianSells.map((p) => ({
      ...p,
      title: localizePoliticianSeatTitle(m, p.title, p.titleKey),
    })),
    todaysTrades: (data.todaysTrades ?? []).map((p) => ({
      ...p,
      title: localizePoliticianSeatTitle(m, p.title, p.titleKey),
    })),
    primeBrokers: normalizePrimeBrokers(data.primeBrokers),
  };
}
