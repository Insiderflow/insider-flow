import { USE_FIXTURE_BUILDERS } from '@/api/config';
import {
  mobileApi,
  type MobileSignalDetailPayload,
  type MobileSignalsBriefPayload,
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
      sideFilter: 'all',
      generatedAt: new Date().toISOString(),
      signals: [],
      aiSummary: {
        headline: m.mock.aiSummary.headline,
        narrative: m.mock.aiSummary.narrative ?? '',
        bullets: m.mock.aiSummary.bullets,
        sentiment: 'mixed',
      },
    };
  }
  return mobileApi.signals(period, feed, locale, tier, 'all');
}

export async function fetchSignalsBrief(
  period: Period = '7D',
  feed: SignalFeedFilter = 'all',
  locale: Locale = 'zh-Hant',
  tier: SignalTierFilter = period === '1D' ? 'medium_plus' : 'all',
): Promise<MobileSignalsBriefPayload> {
  if (USE_FIXTURE_BUILDERS) {
    const m = getMessages(locale);
    return {
      generatedAt: new Date().toISOString(),
      aiSummary: {
        headline: m.mock.aiSummary.headline,
        narrative: m.mock.aiSummary.narrative ?? '',
        bullets: m.mock.aiSummary.bullets,
        sentiment: 'mixed',
      },
    };
  }
  return mobileApi.signalsBrief(period, feed, locale, tier, 'all');
}

export async function fetchSignalDetail(
  signalId: string,
  locale: Locale = 'zh-Hant',
): Promise<MobileSignalDetailPayload> {
  return mobileApi.signalDetail(signalId, locale);
}
