import { API_BASE_URL, USE_API, USE_FIXTURE_BUILDERS, USE_SNAPSHOT } from '@/api/config';
import { mobileApi } from '@/api/endpoints';
import { getSnapshotLive, hasSnapshots } from '@/api/snapshots';
import type { DataMode } from '@/context/DataModeContext';
import {
  buildLiveFeed,
  type LiveFeedMode,
  type LiveTrade,
} from '@/data/liveMockData';
import { localizePoliticianSeatTitle } from '@/lib/politicianSectorLabel';
import { getMessages } from '@/i18n/messages';
import type { Locale } from '@/i18n/types';
import type { Party, TradeSide } from '@/data/mockData';

export interface LiveFeedData {
  trades: LiveTrade[];
  dates: { id: string; label: string }[];
  etClock: string;
  marketOpen: boolean;
}

function mapApiLiveToFeed(
  raw: Awaited<ReturnType<typeof mobileApi.live>>,
  locale: Locale,
  dataMode: DataMode
): LiveFeedData {
  const m = getMessages(locale);

  return {
    trades: raw.trades.map((t) => ({
      id: t.id,
      ticker: t.ticker,
      displayName: t.displayName,
      title:
        dataMode === 'politician'
          ? localizePoliticianSeatTitle(m, t.title, t.titleKey)
          : t.title,
      showParty: t.showParty,
      party: t.party as Party | undefined,
      side: t.side as TradeSide,
      disclosureBadge:
        dataMode === 'insider' ? m.live.disclosureType : m.live.disclosureType,
      metricLabel: t.metricLabel,
      metricValue: t.metricValue,
      metricPositive: t.metricPositive,
      filedDisplay: t.filedDisplay,
      priceDisplay: t.priceDisplay,
      totalValueDisplay: t.totalValueDisplay,
      dateKey: t.dateKey,
      profilePath: t.profilePath,
      politicianId: t.politicianId,
      imageUrl: t.imageUrl,
    })),
    dates: raw.dates,
    etClock: raw.etClock,
    marketOpen: raw.marketOpen,
  };
}

export async function fetchLiveFeedFromApi(
  locale: Locale,
  dataMode: DataMode,
  _mode: LiveFeedMode = 'live'
): Promise<LiveFeedData> {
  if (USE_FIXTURE_BUILDERS) {
    return buildLiveFeed(locale, dataMode);
  }

  if (USE_SNAPSHOT) {
    const snap = getSnapshotLive(dataMode);
    if (snap) return mapApiLiveToFeed(snap, locale, dataMode);
    if (!hasSnapshots()) {
      console.warn('[snapshot] No live snapshots. Run `npm run snapshot`');
    }
  }

  if (!USE_API) {
    throw new Error('Live feed requires VITE_DATA_SOURCE=live or snapshot.');
  }

  try {
    const raw = await mobileApi.live(dataMode);
    return mapApiLiveToFeed(raw, locale, dataMode);
  } catch (e) {
    const hint =
      API_BASE_URL && !API_BASE_URL.includes('localhost')
        ? ''
        : ' Is insider-flow/web running on port 3000?';
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Live feed API failed (${dataMode}): ${msg}.${hint}`);
  }
}
