import { NextRequest, NextResponse } from 'next/server';
import { buildMobileSignals } from '@/lib/mobile/signalsBuilder';
import { requirePaidMobileUser } from '@/lib/mobile/requirePaidMobile';
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
    const limit = Math.min(
      60,
      Math.max(5, Number(searchParams.get('limit') || 40)),
    );
    const data = await buildMobileSignals(p, limit);
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
