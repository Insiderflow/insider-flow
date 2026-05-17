import { API_BASE_URL, USE_API, USE_FIXTURE_BUILDERS, USE_SNAPSHOT } from '@/api/config';
import { mobileApi } from '@/api/endpoints';
import { localizeDashboard } from '@/api/localizeDashboard';
import { getSnapshotDashboard, hasSnapshots } from '@/api/snapshots';
import type { DataMode } from '@/context/DataModeContext';
import type { DashboardPayload, Period } from '@/data/mockData';
import { buildInsiderDashboard } from '@/data/insiderMockData';
import { buildPoliticianDashboard } from '@/data/mockData';
import type { Locale } from '@/i18n/types';

export async function fetchDashboardFromApi(
  period: Period,
  locale: Locale,
  dataMode: DataMode
): Promise<DashboardPayload> {
  if (USE_FIXTURE_BUILDERS) {
    return dataMode === 'insider'
      ? buildInsiderDashboard(locale)
      : buildPoliticianDashboard(locale);
  }

  if (USE_SNAPSHOT) {
    const snap = getSnapshotDashboard(dataMode, period);
    if (snap) {
      return localizeDashboard(snap, locale);
    }
    const fallback = getSnapshotDashboard(dataMode, '7D');
    if (fallback) {
      return localizeDashboard(fallback, locale);
    }
    if (!hasSnapshots()) {
      console.warn(
        '[snapshot] No dashboard snapshots. Run `npm run snapshot` or set VITE_DATA_SOURCE=live'
      );
    }
  }

  if (!USE_API) {
    throw new Error('Dashboard requires VITE_DATA_SOURCE=live or snapshot.');
  }

  try {
    const raw = await mobileApi.dashboard(dataMode, period, locale);
    return localizeDashboard(raw, locale);
  } catch (e) {
    const hint =
      API_BASE_URL && !API_BASE_URL.includes('localhost')
        ? ' Production may not expose /api/mobile/* yet — use empty VITE_API_BASE_URL and local `npm run dev` in insider-flow/web.'
        : ' Is insider-flow/web running on port 3000?';
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Dashboard API failed (${dataMode}, ${period}): ${msg}.${hint}`);
  }
}
