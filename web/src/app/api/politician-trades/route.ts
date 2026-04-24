import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function normalizeTradeType(rawType: string): 'Buy' | 'Sell' {
  return rawType.toLowerCase().includes('sell') ? 'Sell' : 'Buy';
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get('limit') || '100'), 500);
    const politician = searchParams.get('politician');
    const ticker = searchParams.get('ticker');

    const rows = await prisma.trade.findMany({
      where: {
        ...(politician ? { Politician: { name: { contains: politician, mode: 'insensitive' } } } : {}),
        ...(ticker ? { Issuer: { ticker: { equals: ticker, mode: 'insensitive' } } } : {}),
      },
      include: {
        Politician: true,
        Issuer: true,
      },
      orderBy: { traded_at: 'desc' },
      take: limit,
    });

    const data = rows.map((row) => ({
      id: row.id,
      politician_name: row.Politician?.name || '',
      party: row.Politician?.party || 'Independent',
      chamber: row.Politician?.chamber || 'House',
      state: row.Politician?.state || '',
      ticker: row.Issuer?.ticker || '',
      company_name: row.Issuer?.name || '',
      trade_type: normalizeTradeType(row.type),
      amount_range:
        row.size_min && row.size_max
          ? `$${Number(row.size_min).toLocaleString()} - $${Number(row.size_max).toLocaleString()}`
          : row.size_max
            ? `$${Number(row.size_max).toLocaleString()}`
            : 'Unknown',
      trade_date: row.traded_at.toISOString().slice(0, 10),
      disclosure_date: row.published_at?.toISOString().slice(0, 10) || row.traded_at.toISOString().slice(0, 10),
      sector: row.Issuer?.sector || '',
      committees: '',
      notable: Number(row.size_max || 0) >= 1000000,
      avatar_url: null,
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error('politician-trades error', error);
    return NextResponse.json({ error: 'Failed to fetch politician trades' }, { status: 500 });
  }
}

