import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  aggregateOpenInsiderActivity,
  openInsiderMarketSide,
} from '@/lib/openInsiderActivity';
import { openInsiderTradeValue } from '@/lib/openInsiderTransaction';
import { politicianTradeSeatLabel } from '@/lib/mobile/politicianSeatLabel';
import { getPoliticianImageSrc } from '@/lib/politicianImageMapping';
import { getPoliticianDetailData } from '@/lib/repos/politiciansRepo';

function partyCode(raw: string | null | undefined): 'R' | 'D' | 'I' {
  const p = (raw || '').toLowerCase();
  if (p.startsWith('r')) return 'R';
  if (p.startsWith('d')) return 'D';
  return 'I';
}

function tradeAmount(sizeMin: unknown, sizeMax: unknown): number {
  const max = Number(sizeMax || 0);
  const min = Number(sizeMin || 0);
  return max > 0 ? max : min;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const politicianId = searchParams.get('politicianId');
    const name = searchParams.get('name');
    const ownerId = searchParams.get('ownerId');

    if (ownerId) {
      const rows = await prisma.openInsiderTransaction.findMany({
        where: { ownerId },
        include: { company: true, owner: true },
        orderBy: { transactionDate: 'desc' },
        take: 50,
      });
      if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      const owner = rows[0].owner!;
      const activity = aggregateOpenInsiderActivity(rows);
      return NextResponse.json({
        id: `person-${ownerId}`,
        entityType: 'person',
        name: owner.name,
        ticker: rows[0].company?.ticker || '',
        companyName: rows[0].company?.name || '',
        roles: [owner.title || 'Insider'],
        logoLabel: owner.name.slice(0, 2).toUpperCase(),
        logoColor: '#6366F1',
        allTradesCount: rows.length,
        activity,
        eventStudies: [],
        recentTrades: rows
          .filter((r) => openInsiderMarketSide(r.transactionType) !== null)
          .slice(0, 12)
          .map((r) => ({
            id: r.id,
            ticker: r.company?.ticker || '',
            side: openInsiderMarketSide(r.transactionType)!,
            amount: openInsiderTradeValue(r.valueNumeric),
            shares: Number(String(r.quantity).replace(/[^0-9.-]/g, '') || 0),
            filedAt: r.transactionDate.toISOString().slice(0, 10),
            tradeDate: r.tradeDate.toISOString().slice(0, 10),
          })),
      });
    }

    const politician = politicianId
      ? await prisma.politician.findUnique({ where: { id: politicianId } })
      : name
        ? await prisma.politician.findFirst({
            where: { name: { contains: name, mode: 'insensitive' } },
          })
        : null;

    if (!politician) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const detail = await getPoliticianDetailData({
      id: politician.id,
      page: 1,
      pageSize: 50,
      sortBy: 'traded_at',
      order: 'desc',
    });

    const rows =
      detail?.trades ??
      (await prisma.trade.findMany({
        where: { politician_id: politician.id },
        include: { Issuer: true },
        orderBy: { traded_at: 'desc' },
        take: 50,
      }));

    const buys = rows.filter((r) => !r.type.toLowerCase().includes('sell'));
    const latest = rows[0];
    const totalTrades = detail?.totalTrades ?? rows.length;
    const seat = politicianTradeSeatLabel({
      politicianId: politician.id,
      committees: politician.committees,
      tradeTicker: latest?.Issuer?.ticker,
      issuerSector: latest?.Issuer?.sector,
    });

    return NextResponse.json({
      id: politician.id,
      entityType: 'person',
      name: politician.name,
      ticker: latest?.Issuer?.ticker || '',
      companyName: latest?.Issuer?.name || '',
      roles: [seat.title],
      seatSector: seat.titleKey,
      imageUrl: getPoliticianImageSrc(politician.id, politician.name),
      logoLabel: politician.name.slice(0, 2).toUpperCase(),
      logoColor: politician.party?.startsWith('D') ? '#3B82F6' : '#EF4444',
      allTradesCount: totalTrades,
      activity: {
        totalBuys: buys.reduce((s, r) => s + tradeAmount(r.size_min, r.size_max), 0),
        buyTxCount: buys.length,
        totalSells: rows.length - buys.length,
        sellTxCount: rows.length - buys.length,
        totalOptions: 0,
        optionTxCount: 0,
        avgBuy: 0,
        avgSell: 0,
      },
      eventStudies: [],
      recentTrades: rows.slice(0, 12).map((r) => ({
        id: r.id,
        ticker: r.Issuer?.ticker || '',
        side: r.type.toLowerCase().includes('sell')
          ? r.type.toLowerCase().includes('proposed')
            ? 'proposed_sale'
            : 'sell'
          : 'buy',
        amount: tradeAmount(r.size_min, r.size_max),
        shares: 0,
        filedAt: r.published_at?.toISOString().slice(0, 10) || r.traded_at.toISOString().slice(0, 10),
        tradeDate: r.traded_at.toISOString().slice(0, 10),
      })),
      party: partyCode(politician.party),
      state: politician.state || '',
      chamber: politician.chamber || '',
      politicianCharts: detail
        ? {
            stats: {
              totalTrades: detail.totalTrades,
              issuerCount: detail.topIssuers.length,
              totalVolume: detail.totalVolume,
              maxTrade: detail.maxTrade,
              lastTraded: detail.lastTraded?.toISOString().slice(0, 10) ?? null,
            },
            topIssuers: detail.topIssuers,
            chartPoints: detail.chartPoints,
          }
        : undefined,
    });
  } catch (error) {
    console.error('mobile/person-profile error', error);
    return NextResponse.json({ error: 'Failed to fetch person profile' }, { status: 500 });
  }
}
