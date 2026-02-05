import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  try {
    const { ticker } = await params;
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!ticker) {
      return NextResponse.json({ error: 'Ticker is required' }, { status: 400 });
    }

    const where: any = {
      symbol: ticker,
    };

    // Build date filter properly
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    const priceHistory = await prisma.priceHistory.findMany({
      where,
      orderBy: { date: 'asc' },
    });

    const formatted = priceHistory.map((ph) => ({
      date: ph.date.toISOString().split('T')[0],
      open: ph.open ? Number(ph.open) : null,
      high: ph.high ? Number(ph.high) : null,
      low: ph.low ? Number(ph.low) : null,
      close: Number(ph.close),
      volume: ph.volume ? Number(ph.volume) : null,
    }));

    return NextResponse.json({ data: formatted });
  } catch (error) {
    console.error('Error fetching price history:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', {
      ticker,
      startDate,
      endDate,
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { 
        error: 'Failed to fetch price history',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

