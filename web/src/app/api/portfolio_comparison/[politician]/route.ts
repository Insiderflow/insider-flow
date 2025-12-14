import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

// Price cache to avoid redundant API calls
const priceCache = new Map<string, number | null>();

// Helper to fetch from Yahoo Finance
async function fetchYahooFinance(ticker: string, period1: number, period2: number) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?period1=${period1}&period2=${period2}&interval=1d`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    if (!response.ok) return null;
    const data = await response.json();
    
    if (data.chart?.result?.[0]) {
      const result = data.chart.result[0];
      if (result.indicators?.quote?.[0]) {
        const quotes = result.indicators.quote[0];
        if (quotes.close && quotes.close.length > 0) {
          return quotes.close;
        }
      }
    }
    return null;
  } catch (error) {
    return null;
  }
}

// Get stock price on a specific date (with caching)
async function getPriceOnDate(ticker: string, date: Date): Promise<number | null> {
  if (!ticker) return null;
  
  const cacheKey = `${ticker}_${date.toISOString().split('T')[0]}`;
  if (priceCache.has(cacheKey)) {
    return priceCache.get(cacheKey) || null;
  }
  
  const timestamp = Math.floor(date.getTime() / 1000);
  const prices = await fetchYahooFinance(ticker, timestamp, timestamp + 86400);
  
  let price = null;
  if (prices && prices.length > 0) {
    price = prices[prices.length - 1];
  }
  
  priceCache.set(cacheKey, price);
  return price;
}

// Get current stock price
async function getCurrentPrice(ticker: string): Promise<number | null> {
  if (!ticker) return null;
  
  const cacheKey = `${ticker}_current`;
  if (priceCache.has(cacheKey)) {
    return priceCache.get(cacheKey) || null;
  }
  
  const now = Math.floor(Date.now() / 1000);
  const oneDayAgo = now - 86400;
  const prices = await fetchYahooFinance(ticker, oneDayAgo, now);
  
  let price = null;
  if (prices && prices.length > 0) {
    price = prices[prices.length - 1];
  }
  
  priceCache.set(cacheKey, price);
  return price;
}

// Get S&P 500 price on a date
async function getSP500Price(date: Date): Promise<number | null> {
  const cacheKey = `SP500_${date.toISOString().split('T')[0]}`;
  if (priceCache.has(cacheKey)) {
    return priceCache.get(cacheKey) || null;
  }
  
  const timestamp = Math.floor(date.getTime() / 1000);
  const prices = await fetchYahooFinance('^GSPC', timestamp, timestamp + 86400);
  
  let price = null;
  if (prices && prices.length > 0) {
    price = prices[prices.length - 1];
  }
  
  priceCache.set(cacheKey, price);
  return price;
}

// Load cached portfolio data
function loadCachedData(): Map<string, any> {
  try {
    const cachePath = path.join(process.cwd(), 'portfolio_cache.json');
    if (fs.existsSync(cachePath)) {
      const data = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
      return new Map(Object.entries(data));
    }
  } catch (error) {
    console.error('Error loading cache:', error);
  }
  return new Map();
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ politician: string }> }
) {
  try {
    const { politician } = await params;
    
    // Try to load from cache first
    const cache = loadCachedData();
    
    // Find politician in cache
    let cachedData = null;
    for (const [id, data] of cache.entries()) {
      if (data.politician_name?.toLowerCase().includes(politician.toLowerCase())) {
        cachedData = data;
        break;
      }
    }
    
    // If cached data exists and is recent (less than 24 hours old), use it
    if (cachedData && cachedData.data) {
      const cacheAge = new Date().getTime() - new Date(cachedData.updated_at).getTime();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      if (cacheAge < maxAge) {
        console.log(`Using cached data for ${politician} (age: ${Math.round(cacheAge / 1000 / 60)} minutes)`);
        return NextResponse.json({
          dates: cachedData.data.dates,
          politician_returns: cachedData.data.politician_returns,
          sp500_returns: cachedData.data.sp500_returns,
          trades: [], // Will be fetched separately if needed
          cached: true,
          cached_at: cachedData.updated_at
        });
      }
    }
    
    // If no cache or cache is stale, calculate on-demand (fallback)
    console.log(`Calculating on-demand for ${politician} (no cache or cache expired)`);
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
      Issuer?: { ticker: { in: string[] } | { not: null } };
    } = {
      politician_id: politicianData.id,
      traded_at: { gte: queryStartDate },
      Issuer: { ticker: { not: null } } // Only trades with tickers
    };

    // Add China filter if requested
    if (chinaFilter) {
      whereClause.Issuer = {
        ticker: { in: ['TSM', 'BABA', 'NVDA', 'AAPL'] }
      };
    }

    // Get all trades for the politician with tickers
    const trades = await prisma.trade.findMany({
      where: whereClause,
      include: {
        Issuer: {
          select: {
            ticker: true,
            name: true
          }
        }
      },
      orderBy: { traded_at: 'asc' }
    });

    if (trades.length === 0) {
      return NextResponse.json({ error: 'No trades found' }, { status: 404 });
    }

    // Filter to only trades with valid tickers
    const validTrades = trades.filter(t => t.Issuer?.ticker);

    if (validTrades.length === 0) {
      return NextResponse.json({ error: 'No trades with valid tickers found' }, { status: 404 });
    }

    // Generate monthly date range (last 12 months or from start date)
    const endDate = new Date();
    const dates: string[] = [];
    const currentDate = new Date(queryStartDate);
    currentDate.setDate(1); // Start of month
    
    // Limit to last 12 months for performance
    const maxMonths = 12;
    const startDateForRange = new Date(endDate);
    startDateForRange.setMonth(startDateForRange.getMonth() - maxMonths);
    const actualStartDate = currentDate < startDateForRange ? startDateForRange : currentDate;
    
    let monthCounter = 0;
    const tempDate = new Date(actualStartDate);
    while (tempDate <= endDate && monthCounter < maxMonths) {
      dates.push(new Date(tempDate).toISOString().split('T')[0]);
      tempDate.setMonth(tempDate.getMonth() + 1);
      monthCounter++;
    }

    // Calculate portfolio returns for each month
    const politicianReturns: number[] = [];
    const sp500Returns: number[] = [];
    
    // Get S&P 500 starting price
    const sp500StartPrice = await getSP500Price(actualStartDate);
    await new Promise(resolve => setTimeout(resolve, 100)); // Rate limit
    
    // Process each month
    for (let i = 0; i < dates.length; i++) {
      const monthEnd = new Date(dates[i]);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthEnd.setDate(0); // Last day of month
      
      // Get all trades up to this month
      const tradesUpToMonth = validTrades.filter(t => 
        new Date(t.traded_at) <= monthEnd
      );

      if (tradesUpToMonth.length === 0) {
        politicianReturns.push(i > 0 ? politicianReturns[i - 1] : 0);
        sp500Returns.push(i > 0 ? sp500Returns[i - 1] : 0);
        continue;
      }

      // Calculate cumulative portfolio return up to this month
      let totalWeightedReturn = 0;
      let totalWeight = 0;
      let validTradeCount = 0;

      // Process trades (limit to avoid too many API calls)
      const tradesToProcess = tradesUpToMonth.slice(-50); // Last 50 trades for performance
      
      for (const trade of tradesToProcess) {
        if (!trade.Issuer?.ticker) continue;
        
        try {
          const ticker = trade.Issuer.ticker;
          const tradeDate = new Date(trade.traded_at);
          
          // Get price on trade date
          const tradePrice = await getPriceOnDate(ticker, tradeDate);
          await new Promise(resolve => setTimeout(resolve, 50)); // Rate limit
          
          // Get price at end of month
          const monthEndPrice = await getPriceOnDate(ticker, monthEnd);
          await new Promise(resolve => setTimeout(resolve, 50)); // Rate limit
          
          if (tradePrice && monthEndPrice && tradePrice > 0) {
            const returnPct = ((monthEndPrice - tradePrice) / tradePrice) * 100;
            
            // Calculate trade weight
            let weight = 1;
            if (trade.size_max) {
              weight = Number(trade.size_max) / 1000000;
            } else if (trade.size_min) {
              weight = Number(trade.size_min) / 1000000;
            }
            
            // Adjust for buy/sell
            const multiplier = trade.type?.toLowerCase().includes('sell') ? -1 : 1;
            const adjustedReturn = returnPct * multiplier;
            
            totalWeightedReturn += adjustedReturn * weight;
            totalWeight += weight;
            validTradeCount++;
          }
        } catch (error) {
          // Skip on error
          console.error(`Error processing trade for ${trade.Issuer?.ticker}:`, error);
        }
      }

      // Calculate average return
      const avgReturn = totalWeight > 0 ? totalWeightedReturn / totalWeight : 0;
      politicianReturns.push(avgReturn);

      // Calculate S&P 500 return for this month
      if (sp500StartPrice) {
        const sp500MonthEndPrice = await getSP500Price(monthEnd);
        await new Promise(resolve => setTimeout(resolve, 50)); // Rate limit
        
        if (sp500MonthEndPrice) {
          const sp500Return = ((sp500MonthEndPrice - sp500StartPrice) / sp500StartPrice) * 100;
          sp500Returns.push(sp500Return);
        } else {
          sp500Returns.push(i > 0 ? sp500Returns[i - 1] : 0);
        }
      } else {
        sp500Returns.push(0);
      }
    }

    // Format trades for response
    const formattedTrades = validTrades.slice(-20).map(trade => ({ // Last 20 trades
      issuer_name: trade.Issuer?.name || 'Unknown',
      ticker: trade.Issuer?.ticker || 'N/A',
      buy_sell: trade.type || 'Unknown',
      trade_amount: trade.size_max ? `$${Number(trade.size_max).toLocaleString()}` : 'N/A',
      filled_date: trade.traded_at.toISOString().split('T')[0]
    }));

    return NextResponse.json({
      dates,
      politician_returns: politicianReturns,
      sp500_returns: sp500Returns,
      trades: formattedTrades,
      cached: false
    });

  } catch (error) {
    console.error('Portfolio comparison API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
