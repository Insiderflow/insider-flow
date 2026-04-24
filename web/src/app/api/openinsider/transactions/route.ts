import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get('limit') || '200'), 1000);

    const rows = await prisma.openInsiderTransaction.findMany({
      include: {
        company: true,
        owner: true,
      },
      orderBy: { transactionDate: 'desc' },
      take: limit,
    });

    const data = rows.map((row) => ({
      id: row.id,
      transaction_date: row.transactionDate.toISOString().slice(0, 10),
      trade_date: row.tradeDate.toISOString().slice(0, 10),
      transaction_type: row.transactionType,
      ticker: row.company?.ticker || '',
      company_name: row.company?.name || '',
      owner_name: row.owner?.name || '',
      owner_title: row.owner?.title || '',
      shares: Number(row.quantity.replace(/[^0-9.-]/g, '') || '0'),
      price: Number(row.lastPrice || 0),
      value: row.value || '',
      value_numeric: Number(row.valueNumeric || 0),
      sector: '',
      notable: Number(row.valueNumeric || 0) >= 1000000,
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error('openinsider/transactions error', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

