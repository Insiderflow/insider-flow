import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const [todayTrades, activePoliticians] = await Promise.all([
      prisma.trade.findMany({
        where: { traded_at: { gte: start } },
        select: { type: true },
      }),
      prisma.trade.groupBy({
        by: ['politician_id'],
        where: { traded_at: { gte: start } },
      }),
    ]);

    const buysToday = todayTrades.filter((t) => !t.type.toLowerCase().includes('sell')).length;
    const sellsToday = todayTrades.filter((t) => t.type.toLowerCase().includes('sell')).length;

    return NextResponse.json({
      buysToday,
      sellsToday,
      activeTraders: activePoliticians.length,
      buysDelta: 'live',
      sellsDelta: 'live',
      activeDelta: 'today',
    });
  } catch (error) {
    console.error('dashboard/stats error', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
}

