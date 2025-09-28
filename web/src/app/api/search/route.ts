import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ results: [] });
    }

    const searchTerm = query.trim();
    const results: Array<{
      id: string;
      type: string;
      title: string;
      subtitle: string;
      url: string;
    }> = [];

    // Search politicians
    const politicians = await prisma.politician.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { party: { contains: searchTerm, mode: 'insensitive' } },
          { state: { contains: searchTerm, mode: 'insensitive' } },
        ]
      },
      take: 5,
      include: {
        _count: {
          select: { Trade: true }
        }
      }
    });

    politicians.forEach(politician => {
      results.push({
        id: politician.id,
        type: 'politician',
        title: politician.name,
        subtitle: `${politician.party || '未知政黨'} • ${politician.state || '未知州'} • ${politician._count.Trade} 筆交易`,
        url: `/politicians/${politician.id}`
      });
    });

    // Search issuers
    const issuers = await prisma.issuer.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { ticker: { contains: searchTerm, mode: 'insensitive' } },
          { sector: { contains: searchTerm, mode: 'insensitive' } },
        ]
      },
      take: 5,
      include: {
        _count: {
          select: { Trade: true }
        }
      }
    });

    issuers.forEach(issuer => {
      results.push({
        id: issuer.id,
        type: 'issuer',
        title: issuer.name,
        subtitle: `${issuer.ticker ? `$${issuer.ticker}` : '無代碼'} • ${issuer.sector || '未知行業'} • ${issuer._count.Trade} 筆交易`,
        url: `/issuers/${issuer.id}`
      });
    });

    // Search trades (by politician or issuer name)
    const trades = await prisma.trade.findMany({
      where: {
        OR: [
          { politician: { name: { contains: searchTerm, mode: 'insensitive' } } },
          { issuer: { name: { contains: searchTerm, mode: 'insensitive' } } },
          { issuer: { ticker: { contains: searchTerm, mode: 'insensitive' } } },
        ]
      },
      take: 5,
      include: {
        politician: true,
        issuer: true
      },
      orderBy: { tradedAt: 'desc' }
    });

    trades.forEach(trade => {
      const date = new Date(trade.tradedAt).toLocaleDateString('zh-TW');
      results.push({
        id: trade.id,
        type: 'trade',
        title: `${trade.politician.name} → ${trade.issuer.name}`,
        subtitle: `${trade.type} • ${date} • ${trade.issuer.ticker ? `$${trade.issuer.ticker}` : ''}`,
        url: `/trades?qp=${encodeURIComponent(trade.politician.name)}&qi=${encodeURIComponent(trade.issuer.name)}`
      });
    });

    // Sort results by relevance (exact matches first, then partial matches)
    const sortedResults = results.sort((a, b) => {
      const aExact = a.title.toLowerCase().includes(searchTerm.toLowerCase());
      const bExact = b.title.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      // Then by type priority: politicians, issuers, trades
      const typeOrder = { politician: 0, issuer: 1, trade: 2 };
      return typeOrder[a.type as keyof typeof typeOrder] - typeOrder[b.type as keyof typeof typeOrder];
    });

    return NextResponse.json({ 
      results: sortedResults.slice(0, 15) // Limit to 15 results
    });

  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}
