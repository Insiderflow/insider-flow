import { API_BASE_URL, USE_API, USE_FIXTURE_BUILDERS, USE_SNAPSHOT } from '@/api/config';
import { mobileApi } from '@/api/endpoints';
import { getSnapshotIndustryDetail } from '@/api/snapshots';
import { industryName } from '@/data/mockData';
import type { IndustryDetailPayload, IndustryCompareSide, Period } from '@/data/mockData';
import type { Locale } from '@/i18n/types';
import { getMessages } from '@/i18n/messages';

function localizeDetail(detail: IndustryDetailPayload, locale: Locale): IndustryDetailPayload {
  const m = getMessages(locale);
  return {
    ...detail,
    sectors: detail.sectors.map((s) => ({
      ...s,
      name: m.mock.industries[s.nameKey] ?? s.name ?? industryName(locale, s.nameKey),
    })),
  };
}

function industryApiHint(): string {
  return API_BASE_URL && !API_BASE_URL.includes('localhost')
    ? ' Production may not expose /api/mobile/industry-detail yet.'
    : ' Is insider-flow/web running? Run `npm run snapshot` for offline snapshot mode.';
}

export async function fetchIndustryDetailFromApi(
  sector: string,
  side: IndustryCompareSide,
  period: Period,
  locale: Locale
): Promise<IndustryDetailPayload> {
  if (USE_FIXTURE_BUILDERS) {
    const { buildInsiderDashboard } = await import('@/data/insiderMockData');
    const dash = buildInsiderDashboard(locale);
    const sectors = dash.topIndustries.map((s) => ({
      ...s,
      name: getMessages(locale).mock.industries[s.nameKey] ?? s.name,
    }));
    const active = sectors.find((s) => s.nameKey === sector) ?? sectors[0];
    return localizeDetail(
      {
        sector: active?.nameKey ?? sector,
        side,
        sectors,
        companies: [],
      },
      locale
    );
  }

  if (USE_SNAPSHOT) {
    const snap = getSnapshotIndustryDetail(sector, side, period);
    if (snap) return localizeDetail(snap, locale);
    throw new Error(
      `No snapshot for industry ${sector} (${side}, ${period}). Run \`npm run snapshot\`.`
    );
  }

  if (!USE_API) {
    throw new Error('Industry detail requires VITE_DATA_SOURCE=live or snapshot.');
  }

  try {
    const raw = await mobileApi.industryDetail(sector, side, period);
    return localizeDetail(raw, locale);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Industry detail API failed (${sector}, ${side}, ${period}): ${msg}.${industryApiHint()}`);
  }
}
