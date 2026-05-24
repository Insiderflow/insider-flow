import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { processNewTrade } from '@/lib/notificationService';
import { requireInternalJob } from '@/lib/routeGuards';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const guard = requireInternalJob(request);
  if (guard) return guard;

  try {
    const since = new Date(Date.now() - 10 * 60 * 1000);
    const rows = await prisma.openInsiderTransaction.findMany({
      where: { transactionDate: { gte: since } },
      include: { company: true, owner: true },
      orderBy: { transactionDate: 'desc' },
      take: 500,
    });

    for (const t of rows) {
      await processNewTrade({
        politician: { id: t.ownerId, name: t.owner?.name || '' },
        owner: t.owner ? { name: t.owner.name, id: t.ownerId } : undefined,
        issuer: {
          id: t.companyId,
          name: t.company?.name || '',
          ticker: t.company?.ticker || '',
        },
        type: t.transactionType,
        tradedAt: t.tradeDate.toISOString(),
      });
    }

    return NextResponse.json({ processed: rows.length });
  } catch (e) {
    console.error('process-recent-trades error', e);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
