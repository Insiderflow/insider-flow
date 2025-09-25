import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { rateLimit, keyFromRequest } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    const key = keyFromRequest(req, 'watchlist:mut');
    const rl = rateLimit(key, 30, 1);
    if (!rl.allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    const user = await requireAuth();
    const { politicianId } = await req.json();
    
    if (!politicianId) {
      return NextResponse.json({ error: 'Missing politicianId' }, { status: 400 });
    }

    // Check if politician exists
    const politician = await prisma.politician.findUnique({
      where: { id: politicianId }
    });

    if (!politician) {
      return NextResponse.json({ error: 'Politician not found' }, { status: 404 });
    }

    // Add to watchlist (ignore if already exists)
    await prisma.userWatchlist.create({
      data: { userId: user.id, politicianId }
    }).catch(() => {}); // Ignore unique constraint errors

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to add to watchlist' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const key = keyFromRequest(req, 'watchlist:mut');
    const rl = rateLimit(key, 30, 1);
    if (!rl.allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    const user = await requireAuth();
    const { politicianId } = await req.json();
    
    if (!politicianId) {
      return NextResponse.json({ error: 'Missing politicianId' }, { status: 400 });
    }

    // Remove from watchlist
    await prisma.userWatchlist.deleteMany({
      where: { userId: user.id, politicianId }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to remove from watchlist' }, { status: 500 });
  }
}


