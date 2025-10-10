import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { processNewTrade } from '@/lib/notificationService';

export const dynamic = 'force-dynamic';

export async function POST(_req: NextRequest) {
  try {
    // Process trades in the last 10 minutes
    const since = new Date(Date.now() - 10 * 60 * 1000);
    const rows = await prisma.openInsiderTransaction.findMany({
      where: { transactionDate: { gte: since } },
      include: { company: true, owner: true },
      orderBy: { transactionDate: 'desc' },
      take: 500,
    });

    for (const t of rows) {
      await processNewTrade({
        politician: { id: t.ownerId, name: t.owner?.name || '' }, // reuse TradeData contract
        owner: t.owner ? { id: t.ownerId, name: t.owner.name } : undefined,
        issuer: { id: t.companyId, name: t.company?.name || '', ticker: t.company?.ticker || '' },
        type: t.transactionType,
        tradedAt: t.tradeDate.toISOString(),
      } as any);
    }

    return NextResponse.json({ processed: rows.length });
  } catch (e) {
    console.error('process-recent-trades error', e);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}




