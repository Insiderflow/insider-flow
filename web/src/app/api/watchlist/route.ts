import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { getPoliticianImageSrc } from '@/lib/politicianImageMapping';

function normalizeWatchlistType(type: string | null) {
  if (!type) return type;
  return type === 'ticker' ? 'stock' : type;
}

// GET - Get user's watchlist
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = normalizeWatchlistType(searchParams.get('type')); // 'politician', 'company', 'owner', 'stock'
    const politicianId = searchParams.get('politicianId');
    const companyId = searchParams.get('companyId');
    const ownerId = searchParams.get('ownerId');
    const ticker = searchParams.get('ticker');
    const user = await getSessionUser(request);
    if (!user) return NextResponse.json({ error: '請先登入' }, { status: 401 });

    const where: {
      user_id: string;
      watchlist_type?: string;
      politician_id?: string | null;
      company_id?: string | null;
      owner_id?: string | null;
      ticker?: string | null;
    } = { user_id: user.id };
    if (type) {
      where.watchlist_type = type;
    }
    if (politicianId) where.politician_id = politicianId;
    if (companyId) where.company_id = companyId;
    if (ownerId) where.owner_id = ownerId;
    if (ticker) where.ticker = ticker;

    const rows = await prisma.userWatchlist.findMany({
      where,
      include: {
        Politician: true,
        Company: true,
        Owner: true,
      },
      orderBy: { created_at: 'desc' }
    });

    const origin = new URL(request.url).origin;
    const politicianIds = rows
      .map((item) => item.politician_id)
      .filter((id): id is string => Boolean(id));

    const latestTrades =
      politicianIds.length > 0
        ? await prisma.trade.findMany({
            where: { politician_id: { in: politicianIds } },
            select: {
              politician_id: true,
              traded_at: true,
              Issuer: { select: { sector: true } },
            },
            orderBy: { traded_at: 'desc' },
          })
        : [];

    const sectorByPoliticianId = new Map<string, string | null>();
    for (const trade of latestTrades) {
      if (!trade.politician_id) continue;
      if (sectorByPoliticianId.has(trade.politician_id)) continue;
      sectorByPoliticianId.set(trade.politician_id, trade.Issuer?.sector || null);
    }

    const watchlist = rows.map((item) => {
      if (!item.politician_id || !item.Politician) return item;
      return {
        ...item,
        sector: sectorByPoliticianId.get(item.politician_id) || null,
        avatar_url: `${origin}${getPoliticianImageSrc(item.Politician.id, item.Politician.name)}`,
      };
    });

    return NextResponse.json({ watchlist });
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Add item to watchlist
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) return NextResponse.json({ error: '請先登入' }, { status: 401 });
    const body = await request.json();
    const { type: rawType, politicianId, politicianName, companyId, ownerId, ticker } = body;
    const type = normalizeWatchlistType(rawType);
    let resolvedPoliticianId: string | null = politicianId || null;

    if (!type) {
      return NextResponse.json({ error: 'Type required' }, { status: 400 });
    }

    if (type === 'politician' && !resolvedPoliticianId && politicianName) {
      const matched = await prisma.politician.findFirst({
        where: { name: { equals: String(politicianName), mode: 'insensitive' } },
        select: { id: true },
      });
      resolvedPoliticianId = matched?.id || null;
    }

    // Validate based on type
    if (type === 'politician' && !resolvedPoliticianId) {
      return NextResponse.json({ error: 'Politician ID required for politician watchlist' }, { status: 400 });
    }
    if (type === 'company' && !companyId) {
      return NextResponse.json({ error: 'Company ID required for company watchlist' }, { status: 400 });
    }
    if (type === 'owner' && !ownerId) {
      return NextResponse.json({ error: 'Owner ID required for owner watchlist' }, { status: 400 });
    }
    if (type === 'stock' && !ticker) {
      return NextResponse.json({ error: 'Ticker required for stock watchlist' }, { status: 400 });
    }

    // Check if already exists
    const existing = await prisma.userWatchlist.findFirst({
      where: {
        user_id: user.id,
        watchlist_type: type,
        ...(resolvedPoliticianId && { politician_id: resolvedPoliticianId }),
        ...(companyId && { company_id: companyId }),
        ...(ownerId && { owner_id: ownerId }),
        ...(ticker && { ticker: ticker }),
      }
    });

    if (existing) {
      return NextResponse.json({ error: 'Item already in watchlist' }, { status: 409 });
    }

    const watchlistItem = await prisma.userWatchlist.create({
      data: {
        user_id: user.id,
        watchlist_type: type,
        politician_id: resolvedPoliticianId,
        company_id: companyId || null,
        owner_id: ownerId || null,
        ticker: ticker || null,
      },
      include: {
        Politician: true,
        Company: true,
        Owner: true,
      }
    });

    return NextResponse.json({ watchlistItem });
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove item from watchlist
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user = await getSessionUser(request);
    if (!user) return NextResponse.json({ error: '請先登入' }, { status: 401 });
    const type = normalizeWatchlistType(searchParams.get('type'));
    const politicianId = searchParams.get('politicianId');
    const companyId = searchParams.get('companyId');
    const ownerId = searchParams.get('ownerId');
    const ticker = searchParams.get('ticker');
    if (!type) return NextResponse.json({ error: 'Type required' }, { status: 400 });

    const where: {
      user_id: string;
      watchlist_type: string;
      politician_id?: string | null;
      company_id?: string | null;
      owner_id?: string | null;
      ticker?: string | null;
    } = {
      user_id: user.id,
      watchlist_type: type,
    };

    if (politicianId) where.politician_id = politicianId;
    if (companyId) where.company_id = companyId;
    if (ownerId) where.owner_id = ownerId;
    if (ticker) where.ticker = ticker;

    await prisma.userWatchlist.deleteMany({ where });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}