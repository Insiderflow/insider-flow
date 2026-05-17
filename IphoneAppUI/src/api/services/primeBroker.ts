import { USE_API, USE_FIXTURE_BUILDERS } from '@/api/config';
import { mobileApi } from '@/api/endpoints';
import { industryName } from '@/data/mockData';
import { MOCK_PRIME_BROKER_DETAILS } from '@/data/primeBrokerMock';
import type { PrimeBrokerDetail, Period } from '@/data/mockData';
import type { Locale } from '@/i18n/types';
import { getMessages } from '@/i18n/messages';

function localizeDetail(detail: PrimeBrokerDetail, locale: Locale): PrimeBrokerDetail {
  const m = getMessages(locale);
  return {
    ...detail,
    industries: detail.industries.map((row) => ({
      ...row,
      name:
        m.mock.industries[row.nameKey] ?? row.name ?? industryName(locale, row.nameKey),
    })),
  };
}

export async function fetchPrimeBrokerFromApi(
  slug: string,
  period: Period,
  locale: Locale
): Promise<PrimeBrokerDetail | null> {
  if (USE_FIXTURE_BUILDERS) {
    const mock = MOCK_PRIME_BROKER_DETAILS[slug];
    return mock ? localizeDetail(mock, locale) : null;
  }

  if (!USE_API) return null;

  try {
    const raw = await mobileApi.primeBroker(slug, period);
    return localizeDetail(raw, locale);
  } catch {
    return null;
  }
}
