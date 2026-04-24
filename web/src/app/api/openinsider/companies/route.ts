import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get('limit') || '200'), 1000);

    const rows = await prisma.openInsiderCompany.findMany({
      include: {
        _count: {
          select: { transactions: true },
        },
        transactions: {
          select: { transactionDate: true },
          orderBy: { transactionDate: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });

    const data = rows.map((row) => ({
      id: row.id,
      ticker: row.ticker,
      company_name: row.name,
      sector: '',
      country: 'US',
      trade_count: row._count.transactions,
      last_trade_date: row.transactions[0]?.transactionDate.toISOString().slice(0, 10) || '',
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error('openinsider/companies error', error);
    return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 });
  }
}

