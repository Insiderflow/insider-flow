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
  } catch {
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

// Get current stock price (unused but kept for potential future use)
// async function getCurrentPrice(ticker: string): Promise<number | null> {
//   if (!ticker) return null;
//   
//   const cacheKey = `${ticker}_current`;
//   if (priceCache.has(cacheKey)) {
//     return priceCache.get(cacheKey) || null;
//   }
//   
//   const now = Math.floor(Date.now() / 1000);
//   const oneDayAgo = now - 86400;
//   const prices = await fetchYahooFinance(ticker, oneDayAgo, now);
//   
//   let price = null;
//   if (prices && prices.length > 0) {
//     price = prices[prices.length - 1];
//   }
//   
//   priceCache.set(cacheKey, price);
//   return price;
// }

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
function loadCachedData(): Map<string, { politician_name?: string; data?: { dates: string[]; politician_returns: number[]; sp500_returns: number[] }; updated_at: string }> {
  try {
    const cachePath = path.join(process.cwd(), 'portfolio_cache.json');
    if (fs.existsSync(cachePath)) {
      const data = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
      return new Map(Object.entries(data));
    }
  } catch {
    // Silently fail - will use on-demand calculation
  }
  return new Map();
}

// Add timeout wrapper for the entire request
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    )
  ]);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ politician: string }> }
) {
  try {
    // Wrap entire handler in timeout (30 seconds max)
    return await withTimeout(handleRequest(request, { params }), 30000);
  } catch (error) {
    console.error('Portfolio comparison API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { 
        error: 'Failed to load portfolio data',
        message: process.env.NODE_ENV === 'development' ? errorMessage : 'Please try again later. If the issue persists, the data may still be calculating.'
      },
      { status: 500 }
    );
  }
}

async function handleRequest(
  request: NextRequest,
  { params }: { params: Promise<{ politician: string }> }
): Promise<NextResponse> {
  const { politician } = await params;
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('start_date');
  const chinaFilter = searchParams.get('china_filter') === 'true';
    
    // Try to load from cache first (only if file exists and is accessible)
    let cachedData = null;
    const portfolioCache = loadCachedData();
    
    try {
      if (portfolioCache.size === 0) {
        console.log(`⚠️  Cache is empty for ${politician}`);
      } else {
        // First try exact name match
        for (const [, data] of portfolioCache.entries()) {
          if (data.politician_name?.toLowerCase() === politician.toLowerCase()) {
            cachedData = data;
            console.log(`✅ Exact match found: ${data.politician_name}`);
            break;
          }
        }
        
        // If not found, try partial match
        if (!cachedData) {
          const politicianLower = politician.toLowerCase().trim();
          for (const [, data] of portfolioCache.entries()) {
            const cacheNameLower = data.politician_name?.toLowerCase().trim() || '';
            if (cacheNameLower.includes(politicianLower) || politicianLower.includes(cacheNameLower)) {
              cachedData = data;
              console.log(`✅ Partial match found: ${data.politician_name} for ${politician}`);
              break;
            }
          }
        }
        
        // If still not found, try by ID (in case politician parameter is an ID)
        if (!cachedData) {
          const cacheById = portfolioCache.get(politician);
          if (cacheById && cacheById.data) {
            cachedData = cacheById;
            console.log(`✅ Found by ID: ${politician}`);
          }
        }
      }
      
      // If cached data exists, use it (removed 24-hour age check for now)
      if (cachedData && cachedData.data && cachedData.data.dates && cachedData.data.dates.length > 0) {
        console.log(`✅ Using cached data for ${politician} (found: ${cachedData.politician_name})`);
        
        // Still fetch trades for the response (with timeout)
        let formattedTrades: Array<{
          issuer_name: string;
          ticker: string;
          buy_sell: string;
          trade_amount: string;
          filled_date: string;
        }> = [];
        try {
          const politicianData = await Promise.race([
            prisma.politician.findFirst({
              where: { name: { contains: politician, mode: 'insensitive' } },
              include: {
                Trade: {
                  where: {
                    Issuer: { ticker: { not: null } }
                  },
                  include: {
                    Issuer: {
                      select: {
                        ticker: true,
                        name: true
                      }
                    }
                  },
                  orderBy: { traded_at: 'desc' },
                  take: 20
                }
              }
            }),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)) // 5 second timeout
          ]);
          
          if (politicianData) {
            formattedTrades = politicianData.Trade.map(trade => ({
              issuer_name: trade.Issuer?.name || 'Unknown',
              ticker: trade.Issuer?.ticker || 'N/A',
              buy_sell: trade.type || 'Unknown',
              trade_amount: trade.size_max ? `$${Number(trade.size_max).toLocaleString()}` : 'N/A',
              filled_date: trade.traded_at.toISOString().split('T')[0]
            }));
          }
        } catch (tradeError) {
          console.error(`Error fetching trades for ${politician}:`, tradeError);
          // Continue without trades
        }
        
        return NextResponse.json({
          dates: cachedData.data.dates,
          politician_returns: cachedData.data.politician_returns,
          sp500_returns: cachedData.data.sp500_returns,
          trades: formattedTrades,
          cached: true,
          cached_at: cachedData.updated_at
        });
      } else {
        console.log(`⚠️  No valid cached data found for ${politician} (cachedData: ${!!cachedData}, hasData: ${!!cachedData?.data}, hasDates: ${!!cachedData?.data?.dates})`);
      }
    } catch (error) {
      console.error(`Error loading cache for ${politician}:`, error instanceof Error ? error.message : 'Unknown error');
      // Continue to on-demand calculation
    }
    
    // If no cache or cache is stale, calculate on-demand (fallback)
    // Note: startDate and chinaFilter already extracted above

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
    
    // Get S&P 500 starting price (with timeout)
    let sp500StartPrice: number | null = null;
    try {
      sp500StartPrice = await Promise.race([
        getSP500Price(actualStartDate),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)) // 5 second timeout
      ]);
    } catch (error) {
      console.error('Error fetching S&P 500 start price:', error);
    }
    
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

      // Process trades (limit to avoid too many API calls and timeouts)
      const tradesToProcess = tradesUpToMonth.slice(-10); // Last 10 trades for performance
      
      for (const trade of tradesToProcess) {
        if (!trade.Issuer?.ticker) continue;
        
        try {
          const ticker = trade.Issuer.ticker;
          const tradeDate = new Date(trade.traded_at);
          
          // Get price on trade date (with timeout)
          const tradePrice = await Promise.race([
            getPriceOnDate(ticker, tradeDate),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000)) // 2 second timeout
          ]);
          await new Promise(resolve => setTimeout(resolve, 50)); // Rate limit
          
          // Get price at end of month (with timeout)
          const monthEndPrice = await Promise.race([
            getPriceOnDate(ticker, monthEnd),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000)) // 2 second timeout
          ]);
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
          }
        } catch (error) {
          // Skip on error
          console.error(`Error processing trade for ${trade.Issuer?.ticker}:`, error instanceof Error ? error.message : 'Unknown error');
        }
      }

      // Calculate average return
      const avgReturn = totalWeight > 0 ? totalWeightedReturn / totalWeight : 0;
      politicianReturns.push(avgReturn);

      // Calculate S&P 500 return for this month (with timeout)
      if (sp500StartPrice) {
        try {
          const sp500MonthEndPrice = await Promise.race([
            getSP500Price(monthEnd),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)) // 3 second timeout
          ]);
          await new Promise(resolve => setTimeout(resolve, 50)); // Rate limit
          
          if (sp500MonthEndPrice) {
            const sp500Return = ((sp500MonthEndPrice - sp500StartPrice) / sp500StartPrice) * 100;
            sp500Returns.push(sp500Return);
          } else {
            sp500Returns.push(i > 0 ? sp500Returns[i - 1] : 0);
          }
        } catch {
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

    // Ensure we have data for all dates (fill missing with zeros if needed)
    while (politicianReturns.length < dates.length) {
      politicianReturns.push(0);
    }
    while (sp500Returns.length < dates.length) {
      sp500Returns.push(0);
    }

    return NextResponse.json({
      dates,
      politician_returns: politicianReturns,
      sp500_returns: sp500Returns,
      trades: formattedTrades,
      cached: false
    });
}
