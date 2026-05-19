import { USE_FIXTURE_BUILDERS } from '@/api/config';
import {
  mobileApi,
  type MobileSignalDetailPayload,
  type MobileSignalsPayload,
} from '@/api/endpoints';
import type { Period } from '@/data/mockData';
import type { SignalFeedFilter, SignalTierFilter } from '@/api/endpoints';
import { getMessages } from '@/i18n/messages';
import type { Locale } from '@/i18n/types';

export async function fetchSignals(
  period: Period = '7D',
  feed: SignalFeedFilter = 'all',
  locale: Locale = 'zh-Hant',
  tier: SignalTierFilter = period === '1D' ? 'medium_plus' : 'all',
): Promise<MobileSignalsPayload> {
  if (USE_FIXTURE_BUILDERS) {
    const m = getMessages(locale);
    return {
      period,
      feed,
      tierFilter: tier,
      generatedAt: new Date().toISOString(),
      aiSummary: {
        headline: m.mock.aiSummary.headline,
        narrative: m.mock.aiSummary.narrative ?? '',
        bullets: m.mock.aiSummary.bullets,
        sentiment: 'mixed',
      },
      signals: [],
    };
  }
  return mobileApi.signals(period, feed, locale, tier);
}

export async function fetchSignalDetail(
  signalId: string,
  locale: Locale = 'zh-Hant',
): Promise<MobileSignalDetailPayload> {
  return mobileApi.signalDetail(signalId, locale);
}
