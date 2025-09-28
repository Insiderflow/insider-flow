import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ politician: string }> }
) {
  try {
    const { politician } = await params;
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date');
    const chinaFilter = searchParams.get('china_filter') === 'true';

    // Get politician info and earliest trade date
    const politicianData = await prisma.politician.findFirst({
      where: { name: { contains: politician, mode: 'insensitive' } },
      include: {
        Trade: {
          orderBy: { traded_at: 'asc' },
          take: 1
        }
      }
    });

    if (!politicianData) {
      return NextResponse.json({ error: 'Politician not found' }, { status: 404 });
    }

    const defaultStartDate = politicianData.Trade[0]?.traded_at || new Date('2020-01-01');
    const queryStartDate = startDate ? new Date(startDate) : defaultStartDate;

    // Build where clause for trades
        const whereClause: {
          politician_id: string;
          traded_at: { gte: Date };
          Issuer?: { ticker: { in: string[] } };
        } = {
      politician_id: politicianData.id,
      traded_at: { gte: queryStartDate }
    };

    // Add China filter if requested
    if (chinaFilter) {
      whereClause.Issuer = {
        ticker: { in: ['TSM', 'BABA', 'NVDA', 'AAPL'] }
      };
    }

    // Get all trades for the politician
    const trades = await prisma.trade.findMany({
      where: whereClause,
      include: {
        Issuer: true
      },
      orderBy: { traded_at: 'asc' }
    });

    if (trades.length === 0) {
      return NextResponse.json({ error: 'No trades found' }, { status: 404 });
    }

    // Generate monthly date range
    const endDate = new Date('2025-09-25');
    const dates: string[] = [];
    const currentDate = new Date(queryStartDate);
    
    while (currentDate <= endDate) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    // Calculate portfolio returns (simplified for demo)
    const politicianReturns: number[] = [];
    const sp500Returns: number[] = [];

    // Generate sample data for demonstration
    for (let i = 0; i < dates.length; i++) {
      // Simulate politician returns with some volatility
      const baseReturn = Math.sin(i * 0.1) * 20 + (i * 0.5);
      const volatility = (Math.random() - 0.5) * 10;
      politicianReturns.push(baseReturn + volatility);

      // Simulate S&P 500 returns (more stable)
      const sp500Base = Math.sin(i * 0.05) * 10 + (i * 0.3);
      const sp500Volatility = (Math.random() - 0.5) * 5;
      sp500Returns.push(sp500Base + sp500Volatility);
    }

    // Format trades for response
    const formattedTrades = trades.map(trade => ({
      issuer_name: trade.Issuer.name,
      ticker: trade.Issuer.ticker,
      buy_sell: trade.type,
      trade_amount: trade.size_max ? `$${Number(trade.size_max).toLocaleString()}` : 'N/A',
      filled_date: trade.traded_at.toISOString().split('T')[0]
    }));

    return NextResponse.json({
      dates,
      politician_returns: politicianReturns,
      sp500_returns: sp500Returns,
      trades: formattedTrades
    });

  } catch (error) {
    console.error('Portfolio comparison API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
