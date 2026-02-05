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

    // Check if priceHistory model exists in Prisma schema
    // If not, return empty array to trigger Yahoo Finance fallback
    let formatted: Array<{
      date: string;
      open: number | null;
      high: number | null;
      low: number | null;
      close: number;
      volume: number | null;
    }> = [];

    try {
      // @ts-expect-error - priceHistory model may not exist in schema
      const priceHistory = await prisma.priceHistory.findMany({
        where,
        orderBy: { date: 'asc' },
      });

      formatted = priceHistory.map((ph: {
        date: Date;
        open: unknown;
        high: unknown;
        low: unknown;
        close: unknown;
        volume: unknown;
      }) => ({
        date: ph.date.toISOString().split('T')[0],
        open: ph.open ? Number(ph.open) : null,
        high: ph.high ? Number(ph.high) : null,
        low: ph.low ? Number(ph.low) : null,
        close: Number(ph.close),
        volume: ph.volume ? Number(ph.volume) : null,
      }));
    } catch (modelError) {
      // Model doesn't exist or other error - return empty array to trigger fallback
      console.log('PriceHistory model not available, returning empty data for Yahoo Finance fallback');
    }

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

