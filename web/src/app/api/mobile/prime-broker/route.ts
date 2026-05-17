import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  buildPrimeBrokerDetail,
  isPrimeBrokerFiler,
  loadIssuerSectorByTicker,
} from '@/lib/mobile/primeBroker';
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
    const slug = searchParams.get('slug') || searchParams.get('id') || '';
    const period = (searchParams.get('period') || '7D') as MobilePeriod;
    const valid: MobilePeriod[] = ['1D', '7D', '30D', '90D'];
    const p = valid.includes(period) ? period : '7D';

    if (!slug) {
      return NextResponse.json({ error: 'slug required' }, { status: 400 });
    }

    const since = periodStart(p);
    const candidates = await prisma.openInsiderTransaction.findMany({
      where: {
        transactionDate: { gte: since },
        owner: {
          isInstitution: true,
          title: { contains: '10%', mode: 'insensitive' },
        },
      },
      include: { company: true, owner: true },
      orderBy: { transactionDate: 'desc' },
      take: 3000,
    });
    const rows = candidates.filter((r) =>
      isPrimeBrokerFiler(r.owner.name, r.owner.title),
    );

    const tickers = [
      ...new Set(
        rows
          .map((r) => r.company?.ticker?.trim().toUpperCase())
          .filter((t): t is string => Boolean(t)),
      ),
    ];
    const issuerByTicker = await loadIssuerSectorByTicker(tickers, prisma);

    const detail = buildPrimeBrokerDetail(rows, issuerByTicker, slug);
    if (!detail) {
      return NextResponse.json({ error: 'Broker not found' }, { status: 404 });
    }

    return NextResponse.json(detail);
  } catch (error) {
    console.error('mobile/prime-broker error', error);
    return NextResponse.json({ error: 'Failed to load prime broker' }, { status: 500 });
  }
}
