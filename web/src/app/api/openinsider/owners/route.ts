import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get('limit') || '200'), 1000);

    const rows = await prisma.openInsiderOwner.findMany({
      include: {
        _count: {
          select: { transactions: true },
        },
        transactions: {
          include: { company: true },
          orderBy: { transactionDate: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });

    const data = rows.map((row) => ({
      id: row.id,
      owner_name: row.name,
      owner_title: row.title || '',
      company_name: row.transactions[0]?.company?.name || '',
      ticker: row.transactions[0]?.company?.ticker || '',
      trade_count: row._count.transactions,
      last_trade_date: row.transactions[0]?.transactionDate.toISOString().slice(0, 10) || '',
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error('openinsider/owners error', error);
    return NextResponse.json({ error: 'Failed to fetch owners' }, { status: 500 });
  }
}

