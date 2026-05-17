import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getIssuerDetailData } from '@/lib/repos/issuersRepo';

function partyCode(raw: string | null | undefined): 'R' | 'D' | 'I' {
  const p = (raw || '').toLowerCase();
  if (p.startsWith('r') || p.includes('republican')) return 'R';
  if (p.startsWith('d') || p.includes('democrat')) return 'D';
  return 'I';
}

function tradeSide(type: string): 'buy' | 'sell' | 'proposed_sale' {
  const t = type.toLowerCase();
  if (t.includes('proposed')) return 'proposed_sale';
  if (t.includes('sell')) return 'sell';
  return 'buy';
}

function tradeAmount(sizeMin: unknown, sizeMax: unknown): number {
  const max = Number(sizeMax || 0);
  const min = Number(sizeMin || 0);
  if (max > 0) return max;
  if (min > 0) return min;
  return 0;
}

async function resolveIssuer(idOrTicker: string) {
  const direct = await prisma.issuer.findUnique({
    where: { id: idOrTicker },
    select: { id: true },
  });
  if (direct) return direct.id;

  const byTicker = await prisma.issuer.findFirst({
    where: { ticker: { equals: idOrTicker, mode: 'insensitive' } },
    select: { id: true },
  });
  return byTicker?.id ?? null;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const idParam = searchParams.get('issuerId') || searchParams.get('id');
    const tickerParam = searchParams.get('ticker');

    const resolvedId = idParam
      ? await resolveIssuer(idParam)
      : tickerParam
        ? await resolveIssuer(tickerParam)
        : null;

    if (!resolvedId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const detail = await getIssuerDetailData(resolvedId);
    if (!detail) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const { issuer, stats, chartPoints, recentTrades, politicians } = detail;
    const partyByPoliticianId = new Map(
      politicians.map((p) => [p.id, partyCode(p.party)])
    );

    return NextResponse.json({
      id: issuer.id,
      name: issuer.name,
      ticker: issuer.ticker,
      sector: issuer.sector,
      sectorKey: issuer.sector || 'Other',
      country: issuer.country,
      stats: {
        trades: stats.trades,
        politicians: stats.politicians,
        totalVolume: stats.totalVolume,
        maxTrade: stats.maxTrade,
        lastTraded: stats.lastTraded?.toISOString().slice(0, 10) ?? null,
      },
      chartPoints,
      topPoliticians: politicians.slice(0, 12).map((p) => ({
        id: p.id,
        name: p.name,
        party: partyCode(p.party),
        trades: p.trades,
        totalVolume: p.totalVolume,
      })),
      recentTrades: recentTrades.map((t) => ({
        id: t.id,
        politicianId: t.politician.id,
        politicianName: t.politician.name,
        party: partyByPoliticianId.get(t.politician.id) ?? 'I',
        side: tradeSide(t.type),
        amount: tradeAmount(t.sizeMin, t.sizeMax),
        tradeDate: t.tradedAt.toISOString().slice(0, 10),
        filedAt: t.publishedAt?.toISOString().slice(0, 10) || t.tradedAt.toISOString().slice(0, 10),
      })),
    });
  } catch (error) {
    console.error('mobile/issuer-profile error', error);
    return NextResponse.json({ error: 'Failed to fetch issuer profile' }, { status: 500 });
  }
}
