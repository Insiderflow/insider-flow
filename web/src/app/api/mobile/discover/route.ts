import { NextRequest, NextResponse } from 'next/server';
import { buildMobileDiscover } from '@/lib/mobile/discoverBuilder';
import type { MobilePeriod } from '@/lib/mobile/dashboardBuilder';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const period = (searchParams.get('period') || '7D') as MobilePeriod;
    const valid: MobilePeriod[] = ['1D', '7D', '30D', '90D'];
    const p = valid.includes(period) ? period : '7D';
    const data = await buildMobileDiscover(p);
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (error) {
    console.error('mobile/discover error', error);
    return NextResponse.json({ error: 'Failed to build discover feed' }, { status: 500 });
  }
}
