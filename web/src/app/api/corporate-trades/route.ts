import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function normalizeTradeType(rawType: string): 'Buy' | 'Sell' {
  return rawType.toLowerCase().includes('sell') ? 'Sell' : 'Buy';
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get('limit') || '100'), 500);
    const ticker = searchParams.get('ticker');

    const rows = await prisma.openInsiderTransaction.findMany({
      where: {
        ...(ticker
          ? {
              company: {
                ticker: { equals: ticker, mode: 'insensitive' },
              },
            }
          : {}),
      },
      include: {
        company: true,
        owner: true,
      },
      orderBy: { transactionDate: 'desc' },
      take: limit,
    });

    const data = rows.map((row) => ({
      id: row.id,
      insider_name: row.owner?.name || '',
      title: row.owner?.title || '',
      ticker: row.company?.ticker || '',
      company_name: row.company?.name || '',
      trade_type: normalizeTradeType(row.transactionType),
      shares: Number(row.quantity.replace(/[^0-9.-]/g, '') || '0'),
      price_per_share: Number(row.lastPrice || 0),
      total_value: Number(row.valueNumeric || 0),
      trade_date: row.tradeDate.toISOString().slice(0, 10),
      filing_date: row.transactionDate.toISOString().slice(0, 10),
      sector: '',
      ownership_change_pct: 0,
      notable: Number(row.valueNumeric || 0) >= 1000000,
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error('corporate-trades error', error);
    return NextResponse.json({ error: 'Failed to fetch corporate trades' }, { status: 500 });
  }
}

