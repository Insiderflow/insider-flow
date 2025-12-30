import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const latest = await prisma.openInsiderTransaction.findFirst({
      orderBy: { transactionDate: 'desc' },
      select: { transactionDate: true },
    });
    
    return NextResponse.json({ 
      latestDate: latest?.transactionDate || null,
      formatted: latest?.transactionDate ? latest.transactionDate.toISOString().split('T')[0] : null
    });
  } catch (error) {
    console.error('Error fetching latest transaction date:', error);
    return NextResponse.json({ error: 'Failed to fetch latest date' }, { status: 500 });
  }
}
















