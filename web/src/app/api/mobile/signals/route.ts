import { NextRequest, NextResponse } from 'next/server';
import {
  buildMobileSignals,
  defaultSignalsLimit,
  defaultTierForPeriod,
  type SignalFeed,
  type SignalTierFilter,
} from '@/lib/mobile/signalsBuilder';
import { requirePaidMobileUser } from '@/lib/mobile/requirePaidMobile';
import type { BriefLocale } from '@/lib/mobile/dailyTradeBrief';
import type { MobilePeriod } from '@/lib/mobile/dashboardBuilder';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const auth = await requirePaidMobileUser(req);
  if ('error' in auth) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const period = (searchParams.get('period') || '7D') as MobilePeriod;
    const valid: MobilePeriod[] = ['1D', '7D', '30D', '90D'];
    const p = valid.includes(period) ? period : '7D';
    const tierRaw = (searchParams.get('tier') || defaultTierForPeriod(p)).toLowerCase();
    const tierFilter: SignalTierFilter =
      tierRaw === 'high' || tierRaw === 'medium_plus' ? tierRaw : 'all';
    const defaultLimit = defaultSignalsLimit(p);
    const limit = Math.min(
      60,
      Math.max(5, Number(searchParams.get('limit') || defaultLimit)),
    );
    const feedRaw = (searchParams.get('feed') || 'all').toLowerCase();
    const feed: SignalFeed =
      feedRaw === 'politician' || feedRaw === 'corporate' || feedRaw === 'all'
        ? feedRaw
        : 'all';
    const localeRaw = searchParams.get('locale') || 'zh-Hant';
    const locale: BriefLocale =
      localeRaw === 'zh-Hans' || localeRaw === 'en' ? localeRaw : 'zh-Hant';
    const data = await buildMobileSignals(p, limit, feed, locale, tierFilter);
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'private, no-store, max-age=0' },
    });
  } catch (error) {
    console.error('mobile/signals error', error);
    return NextResponse.json(
      { error: 'Failed to build signals feed' },
      { status: 500 },
    );
  }
}
