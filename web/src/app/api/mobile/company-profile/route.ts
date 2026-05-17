import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isOpenInsiderBuy, isOpenInsiderSell } from '@/lib/openInsiderTransaction';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ticker = (searchParams.get('ticker') || '').toUpperCase();
    if (!ticker) {
      return NextResponse.json({ error: 'ticker required' }, { status: 400 });
    }

    const rows = await prisma.openInsiderTransaction.findMany({
      where: { company: { ticker: { equals: ticker, mode: 'insensitive' } } },
      include: { company: true, owner: true },
      orderBy: { transactionDate: 'desc' },
      take: 100,
    });

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const company = rows[0].company!;
    const buys = rows.filter((r) => isOpenInsiderBuy(r.transactionType));
    const sells = rows.filter((r) => isOpenInsiderSell(r.transactionType));
    const totalBuys = buys.reduce((s, r) => s + Number(r.valueNumeric || 0), 0);
    const totalSells = sells.reduce((s, r) => s + Number(r.valueNumeric || 0), 0);
    const buyPrices = buys.map((r) => Number(r.lastPrice || 0)).filter((p) => p > 0);

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
      allTradesCount: rows.length,
      activity: {
        totalBuys,
        buyTxCount: buys.length,
        totalSells,
        sellTxCount: sells.length,
        totalOptions: 0,
        optionTxCount: 0,
        totalProposedSale: 0,
        proposedTxCount: 0,
        avgBuy: buyPrices.length ? buyPrices.reduce((a, b) => a + b, 0) / buyPrices.length : 0,
        avgSell: 0,
        plan10b5Pct: 0,
        ppSalePct: 0,
        buyRangeMin: buyPrices.length ? Math.min(...buyPrices) : null,
        buyRangeMax: buyPrices.length ? Math.max(...buyPrices) : null,
        sellRangeMin: null,
        sellRangeMax: null,
      },
      companyTrades: rows.slice(0, 20).map((r) => ({
        id: r.id,
        ticker: company.ticker,
        insiderName: r.owner?.name || '',
        personId: r.ownerId ? `person-${r.ownerId}` : undefined,
        side: isOpenInsiderSell(r.transactionType) ? 'sell' : 'buy',
        amount: Number(r.valueNumeric || 0),
        shares: Number(String(r.quantity).replace(/[^0-9.-]/g, '') || 0),
        filedAt: r.transactionDate.toISOString().slice(0, 10),
        tradeDate: r.tradeDate.toISOString().slice(0, 10),
      })),
      insiders: [...ownerCounts.values()].slice(0, 12).map((o) => ({
        id: o.id.startsWith('person-') ? o.id : `person-${o.id}`,
        name: o.name,
        role: o.role,
        tradesCount: o.count,
      })),
      tradeTypes: {
        buy: rows.length ? Math.round((buys.length / rows.length) * 100) : 0,
        sell: rows.length ? Math.round((sells.length / rows.length) * 100) : 0,
        option: 0,
        proposed: 0,
      },
      aiSummary: {
        headline: `${buys.length} buys and ${sells.length} sells for ${ticker}.`,
        bullets: [`${rows.length} Form 4 filings on record.`],
        sentiment: buys.length > sells.length ? 'bullish' : sells.length > buys.length ? 'bearish' : 'mixed',
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
