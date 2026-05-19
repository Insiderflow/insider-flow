import { USE_FIXTURE_BUILDERS } from '@/api/config';
import { mobileApi, type MobileSignalsPayload } from '@/api/endpoints';
import type { Period } from '@/data/mockData';

export async function fetchSignals(period: Period = '7D'): Promise<MobileSignalsPayload> {
  if (USE_FIXTURE_BUILDERS) {
    return {
      period,
      generatedAt: new Date().toISOString(),
      signals: [],
    };
  }
  return mobileApi.signals(period);
}
