import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

// GET - Get user's watchlist
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'politician', 'company', 'owner', 'stock'
    const politicianId = searchParams.get('politicianId');
    const companyId = searchParams.get('companyId');
    const ownerId = searchParams.get('ownerId');
    const ticker = searchParams.get('ticker');
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: '請先登入' }, { status: 401 });

    const where: any = { user_id: user.id };
    if (type) {
      where.watchlist_type = type;
    }
    if (politicianId) where.politician_id = politicianId;
    if (companyId) where.company_id = companyId;
    if (ownerId) where.owner_id = ownerId;
    if (ticker) where.ticker = ticker;

    const watchlist = await prisma.userWatchlist.findMany({
      where,
      include: {
        Politician: true,
        Company: true,
        Owner: true,
      },
      orderBy: { created_at: 'desc' }
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
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: '請先登入' }, { status: 401 });
    const body = await request.json();
    const { type, politicianId, companyId, ownerId, ticker } = body;

    if (!type) {
      return NextResponse.json({ error: 'Type required' }, { status: 400 });
    }

    // Validate based on type
    if (type === 'politician' && !politicianId) {
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
        ...(politicianId && { politician_id: politicianId }),
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
        politician_id: politicianId || null,
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
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: '請先登入' }, { status: 401 });
    const type = searchParams.get('type');
    const politicianId = searchParams.get('politicianId');
    const companyId = searchParams.get('companyId');
    const ownerId = searchParams.get('ownerId');
    const ticker = searchParams.get('ticker');
    if (!type) return NextResponse.json({ error: 'Type required' }, { status: 400 });

    const where: any = {
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