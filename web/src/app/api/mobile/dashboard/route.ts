import { NextRequest, NextResponse } from 'next/server';
import {
  buildInsiderMobileDashboard,
  buildPoliticianMobileDashboard,
  type MobilePeriod,
} from '@/lib/mobile/dashboardBuilder';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('mode') || 'politician';
    const period = (searchParams.get('period') || '7D') as MobilePeriod;
    const validPeriods: MobilePeriod[] = ['1D', '7D', '30D', '90D'];
    const p = validPeriods.includes(period) ? period : '7D';

    const localeRaw = searchParams.get('locale') || 'zh-Hant';
    const locale =
      localeRaw === 'zh-Hans' || localeRaw === 'en' ? localeRaw : 'zh-Hant';

    const data =
      mode === 'insider'
        ? await buildInsiderMobileDashboard(p, locale)
        : await buildPoliticianMobileDashboard(p, locale);

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('mobile/dashboard error', error);
    return NextResponse.json({ error: 'Failed to build dashboard' }, { status: 500 });
  }
}
