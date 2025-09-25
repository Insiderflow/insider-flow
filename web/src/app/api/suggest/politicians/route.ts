import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim();
  if (!q) return NextResponse.json({ names: [] });
  const rows = await prisma.politician.findMany({
    where: { name: { contains: q, mode: 'insensitive' } },
    select: { name: true },
    take: 10,
    orderBy: { name: 'asc' },
  });
  return NextResponse.json({ names: rows.map(r => r.name) });
}


