import { NextRequest, NextResponse } from 'next/server';
import type { BriefLocale } from '@/lib/mobile/dailyTradeBrief';
import { buildSignalDetail } from '@/lib/mobile/signalDetailBuilder';
import { requirePaidMobileUser } from '@/lib/mobile/requirePaidMobile';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requirePaidMobileUser(req);
  if ('error' in auth) return auth.error;

  try {
    const { id } = await context.params;
    const { searchParams } = new URL(req.url);
    const localeRaw = searchParams.get('locale') || 'zh-Hant';
    const locale: BriefLocale =
      localeRaw === 'zh-Hans' || localeRaw === 'en' || localeRaw === 'ko'
        ? localeRaw
        : 'zh-Hant';

    const data = await buildSignalDetail(decodeURIComponent(id), locale);
    if (!data) {
      return NextResponse.json({ error: 'Signal not found' }, { status: 404 });
    }

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'private, no-store, max-age=0' },
    });
  } catch (error) {
    console.error('mobile/signals/[id] error', error);
    return NextResponse.json(
      { error: 'Failed to load signal detail' },
      { status: 500 },
    );
  }
}
