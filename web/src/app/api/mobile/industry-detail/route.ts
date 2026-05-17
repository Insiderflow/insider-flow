import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  buildIndustryDetail,
  loadIssuerSectorByTicker,
  type IndustrySide,
} from '@/lib/mobile/industryDetail';
import type { MobilePeriod } from '@/lib/mobile/dashboardBuilder';

function periodStart(period: MobilePeriod): Date {
  const d = new Date();
  if (period === '1D') d.setDate(d.getDate() - 1);
  else if (period === '7D') d.setDate(d.getDate() - 7);
  else if (period === '90D') d.setDate(d.getDate() - 90);
  else d.setDate(d.getDate() - 30);
  return d;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sector = searchParams.get('sector') || searchParams.get('nameKey') || 'Other';
    const sideRaw = (searchParams.get('side') || 'buy').toLowerCase();
    const side: IndustrySide = sideRaw === 'sell' ? 'sell' : 'buy';
    const period = (searchParams.get('period') || '7D') as MobilePeriod;
    const valid: MobilePeriod[] = ['1D', '7D', '30D', '90D'];
    const p = valid.includes(period) ? period : '7D';

    const since = periodStart(p);
    const rows = await prisma.openInsiderTransaction.findMany({
      where: { transactionDate: { gte: since } },
      include: { company: true, owner: true },
      orderBy: { transactionDate: 'desc' },
      take: 1200,
    });

    const tickers = [
      ...new Set(
        rows
          .map((r) => r.company?.ticker?.trim().toUpperCase())
          .filter((t): t is string => Boolean(t)),
      ),
    ];
    const issuerByTicker = await loadIssuerSectorByTicker(tickers, prisma);

    const detail = buildIndustryDetail(rows, issuerByTicker, sector, side);
    return NextResponse.json(detail);
  } catch (error) {
    console.error('mobile/industry-detail error', error);
    return NextResponse.json({ error: 'Failed to load industry detail' }, { status: 500 });
  }
}
