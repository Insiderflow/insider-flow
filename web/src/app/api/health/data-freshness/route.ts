import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type FreshnessStatus = 'green' | 'yellow' | 'red';

function toHours(ms: number) {
  return ms / (1000 * 60 * 60);
}

function toDays(ms: number) {
  return ms / (1000 * 60 * 60 * 24);
}

function evaluateStatus(tradeAgeDays: number, publishAgeHours: number): FreshnessStatus {
  if (tradeAgeDays > 14 || publishAgeHours > 72) return 'red';
  if (tradeAgeDays > 7 || publishAgeHours > 36) return 'yellow';
  return 'green';
}

export async function GET() {
  try {
    const latest = await prisma.trade.aggregate({
      _max: { traded_at: true, published_at: true },
      _count: { _all: true },
    });
    const latestTrade = latest._max.traded_at ? new Date(latest._max.traded_at) : null;
    const latestPublished = latest._max.published_at ? new Date(latest._max.published_at) : null;

    const now = Date.now();
    const tradeAgeDays = latestTrade ? toDays(now - latestTrade.getTime()) : Number.POSITIVE_INFINITY;
    const publishAgeHours = latestPublished
      ? toHours(now - latestPublished.getTime())
      : Number.POSITIVE_INFINITY;
    const status = evaluateStatus(tradeAgeDays, publishAgeHours);

    return NextResponse.json({
      ok: true,
      status,
      latest: {
        traded_at: latestTrade ? latestTrade.toISOString() : null,
        published_at: latestPublished ? latestPublished.toISOString() : null,
        total_trades: latest._count._all,
      },
      ages: {
        traded_at_days: Number.isFinite(tradeAgeDays) ? Number(tradeAgeDays.toFixed(2)) : null,
        published_at_hours: Number.isFinite(publishAgeHours) ? Number(publishAgeHours.toFixed(2)) : null,
      },
      thresholds: {
        yellow: { trade_days: 7, published_hours: 36 },
        red: { trade_days: 14, published_hours: 72 },
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        status: 'red' as FreshnessStatus,
        error: 'Failed to evaluate data freshness',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
