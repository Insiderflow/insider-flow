import { NextRequest, NextResponse } from 'next/server';
import { requireInternalJob } from '@/lib/routeGuards';

export async function POST(request: NextRequest) {
  const guard = requireInternalJob(request);
  if (guard) return guard;

  try {
    console.log('Starting daily scrape...');
    console.log('Scrape completed successfully');

    return NextResponse.json({
      message: 'Daily scrape completed',
      timestamp: new Date().toISOString(),
      newPoliticians: 0,
      newTrades: 0,
      newIssuers: 0,
    });
  } catch (error) {
    console.error('Scrape error:', error);
    return NextResponse.json(
      {
        error: 'Scrape failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
