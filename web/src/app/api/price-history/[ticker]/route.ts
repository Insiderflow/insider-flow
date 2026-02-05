import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  let ticker: string | undefined;
  let startDate: string | null = null;
  let endDate: string | null = null;
  
  try {
    const paramsData = await params;
    ticker = paramsData.ticker;
    const { searchParams } = new URL(request.url);
    startDate = searchParams.get('startDate');
    endDate = searchParams.get('endDate');

    if (!ticker) {
      return NextResponse.json({ error: 'Ticker is required' }, { status: 400 });
    }

    const where: {
      symbol: string;
      date?: {
        gte?: Date;
        lte?: Date;
      };
    } = {
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
    const formatted: Array<{
      date: string;
      open: number | null;
      high: number | null;
      low: number | null;
      close: number;
      volume: number | null;
    }> = [];

    try {
      // Check if priceHistory exists on prisma client
      if ('priceHistory' in prisma && typeof (prisma as Record<string, unknown>).priceHistory === 'object') {
        const priceHistoryModel = (prisma as Record<string, { findMany: (args: unknown) => Promise<unknown[]> }>).priceHistory;
        const priceHistory = await priceHistoryModel.findMany({
          where,
          orderBy: { date: 'asc' },
        }) as Array<{
          date: Date;
          open: unknown;
          high: unknown;
          low: unknown;
          close: unknown;
          volume: unknown;
        }>;

        formatted.push(...priceHistory.map((ph) => ({
          date: ph.date.toISOString().split('T')[0],
          open: ph.open ? Number(ph.open) : null,
          high: ph.high ? Number(ph.high) : null,
          low: ph.low ? Number(ph.low) : null,
          close: Number(ph.close),
          volume: ph.volume ? Number(ph.volume) : null,
        })));
      } else {
        console.log('PriceHistory model not available in Prisma schema, returning empty data for Yahoo Finance fallback');
      }
    } catch (modelError) {
      // Model doesn't exist or other error - return empty array to trigger fallback
      console.log('PriceHistory query error, returning empty data for Yahoo Finance fallback:', modelError);
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

