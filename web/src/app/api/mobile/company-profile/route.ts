import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  aggregateOpenInsiderActivity,
  openInsiderMarketSide,
  openInsiderTradeTypeBreakdown,
} from '@/lib/openInsiderActivity';
import { openInsiderTradeValue } from '@/lib/openInsiderTransaction';

const PERIOD_DAYS: Record<string, number> = {
  '1D': 1,
  '7D': 7,
  '30D': 30,
  '90D': 90,
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ticker = (searchParams.get('ticker') || '').toUpperCase();
    const period = (searchParams.get('period') || '30D').toUpperCase();
    const days = PERIOD_DAYS[period] ?? 30;

    if (!ticker) {
      return NextResponse.json({ error: 'ticker required' }, { status: 400 });
    }

    const since = new Date();
    since.setUTCDate(since.getUTCDate() - days);
    since.setUTCHours(12, 0, 0, 0);

    const rows = await prisma.openInsiderTransaction.findMany({
      where: {
        company: { ticker: { equals: ticker, mode: 'insensitive' } },
        transactionDate: { gte: since },
      },
      include: { company: true, owner: true },
      orderBy: { transactionDate: 'desc' },
      take: 500,
    });

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const company = rows[0].company!;
    const activity = aggregateOpenInsiderActivity(rows);
    const tradeTypes = openInsiderTradeTypeBreakdown(rows);

    const ownerCounts = new Map<string, { name: string; role: string; count: number; id: string }>();
    for (const r of rows) {
      const id = r.ownerId || r.id;
      const cur = ownerCounts.get(id) || {
        id,
        name: r.owner?.name || 'Unknown',
        role: r.owner?.title || 'Insider',
        count: 0,
      };
      cur.count += 1;
      ownerCounts.set(id, cur);
    }

    const marketTrades = rows
      .filter((r) => openInsiderMarketSide(r.transactionType) !== null)
      .slice(0, 20);

    const profile = {
      id: `company-${ticker.toLowerCase()}`,
      entityType: 'company' as const,
      name: company.name,
      ticker: company.ticker,
      companyName: company.name,
      roles: ['Issuer'],
      logoLabel: company.ticker.slice(0, 2),
      logoColor: '#166534',
      displayName: `${company.name.toUpperCase()} / US`,
      exchange: 'NYSE',
      industry: '—',
      description: company.name,
      dataAsOf: rows[0].transactionDate.toISOString().slice(0, 10),
      period,
      allTradesCount: rows.length,
      activity,
      companyTrades: marketTrades.map((r) => ({
        id: r.id,
        ticker: company.ticker,
        insiderName: r.owner?.name || '',
        personId: r.ownerId ? `person-${r.ownerId}` : undefined,
        side: openInsiderMarketSide(r.transactionType)!,
        amount: openInsiderTradeValue(r.valueNumeric),
        shares: Number(String(r.quantity).replace(/[^0-9.-]/g, '') || 0),
        filedAt: r.transactionDate.toISOString().slice(0, 10),
        tradeDate: r.tradeDate.toISOString().slice(0, 10),
        under10b51: r.transactionType.toLowerCase().includes('+oe'),
      })),
      insiders: [...ownerCounts.values()].slice(0, 12).map((o) => ({
        id: o.id.startsWith('person-') ? o.id : `person-${o.id}`,
        name: o.name,
        role: o.role,
        tradesCount: o.count,
      })),
      tradeTypes,
      aiSummary: {
        headline: `${activity.buyTxCount} open-market buys and ${activity.sellTxCount} sells (${period}).`,
        bullets: [
          `${rows.length} Form 4 line items in period.`,
          activity.plan10b5TxCount > 0
            ? `${activity.plan10b5TxCount} sales under Rule 10b5-1 (+OE).`
            : 'No Rule 10b5-1 tagged sales in period.',
          activity.optionTxCount > 0
            ? `${activity.optionTxCount} non-market rows (awards, tax, exercise, etc.).`
            : null,
        ].filter(Boolean) as string[],
        sentiment:
          activity.buyTxCount > activity.sellTxCount
            ? 'bullish'
            : activity.sellTxCount > activity.buyTxCount
              ? 'bearish'
              : 'mixed',
      },
      eventStudies: [],
      recentTrades: [],
    };

    return NextResponse.json(profile);
  } catch (error) {
    console.error('mobile/company-profile error', error);
    return NextResponse.json({ error: 'Failed to fetch company profile' }, { status: 500 });
  }
}
