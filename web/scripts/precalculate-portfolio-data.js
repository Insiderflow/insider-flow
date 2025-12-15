#!/usr/bin/env node

/**
 * Pre-calculates portfolio performance data for all politicians
 * This runs as a background job to cache results for faster API responses
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Price cache
const priceCache = new Map();

// Fetch from Yahoo Finance
async function fetchYahooFinance(ticker, period1, period2) {
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

// Get price on date with caching
async function getPriceOnDate(ticker, date) {
  if (!ticker) return null;
  
  const cacheKey = `${ticker}_${date.toISOString().split('T')[0]}`;
  if (priceCache.has(cacheKey)) {
    return priceCache.get(cacheKey);
  }
  
  const timestamp = Math.floor(date.getTime() / 1000);
  const prices = await fetchYahooFinance(ticker, timestamp, timestamp + 86400);
  
  let price = null;
  if (prices && prices.length > 0) {
    price = prices[prices.length - 1];
  }
  
  priceCache.set(cacheKey, price);
  await new Promise(resolve => setTimeout(resolve, 50)); // Rate limit
  return price;
}

// Get S&P 500 price with multiple fallback sources
async function getSP500Price(date) {
  const cacheKey = `SP500_${date.toISOString().split('T')[0]}`;
  if (priceCache.has(cacheKey)) {
    return priceCache.get(cacheKey);
  }
  
  const timestamp = Math.floor(date.getTime() / 1000);
  const dateStr = date.toISOString().split('T')[0];
  
  // Try multiple sources in order
  let price = null;
  
  // Source 1: Yahoo Finance (^GSPC)
  try {
    const prices = await fetchYahooFinance('^GSPC', timestamp, timestamp + 86400);
    if (prices && prices.length > 0) {
      price = prices[prices.length - 1];
    }
  } catch (error) {
    // Continue to next source
  }
  
  // Source 2: If Yahoo fails, try SPY ETF (tracks S&P 500 closely)
  if (!price) {
    try {
      await new Promise(resolve => setTimeout(resolve, 200)); // Rate limit
      const spyPrices = await fetchYahooFinance('SPY', timestamp, timestamp + 86400);
      if (spyPrices && spyPrices.length > 0) {
        price = spyPrices[spyPrices.length - 1];
      }
    } catch (error) {
      // Continue to next source
    }
  }
  
  // Source 3: Alpha Vantage (free tier: 5 calls/min, 500 calls/day)
  // Note: Requires API key in ALPHA_VANTAGE_API_KEY env var
  if (!price && process.env.ALPHA_VANTAGE_API_KEY) {
    try {
      await new Promise(resolve => setTimeout(resolve, 200)); // Rate limit
      const avUrl = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=SPY&apikey=${process.env.ALPHA_VANTAGE_API_KEY}&outputsize=compact`;
      const response = await fetch(avUrl);
      if (response.ok) {
        const data = await response.json();
        if (data['Time Series (Daily)'] && data['Time Series (Daily)'][dateStr]) {
          price = parseFloat(data['Time Series (Daily)'][dateStr]['4. close']);
        }
      }
    } catch (error) {
      // Continue to next source
    }
  }
  
  // Source 4: FRED (Federal Reserve Economic Data) - S&P 500 index
  // This is free and reliable but may have delays
  if (!price) {
    try {
      await new Promise(resolve => setTimeout(resolve, 200)); // Rate limit
      // FRED uses SP500 as the series ID
      const fredUrl = `https://api.stlouisfed.org/fred/series/observations?series_id=SP500&api_key=${process.env.FRED_API_KEY || 'demo'}&file_type=json&observation_start=${dateStr}&observation_end=${dateStr}`;
      const response = await fetch(fredUrl);
      if (response.ok) {
        const data = await response.json();
        if (data.observations && data.observations.length > 0 && data.observations[0].value !== '.') {
          price = parseFloat(data.observations[0].value);
        }
      }
    } catch (error) {
      // All sources failed
    }
  }
  
  priceCache.set(cacheKey, price);
  await new Promise(resolve => setTimeout(resolve, 100)); // Rate limit
  return price;
}

// Calculate portfolio data for a politician
async function calculatePortfolioData(politicianId, politicianName) {
  try {
    console.log(`\n📊 Calculating portfolio data for ${politicianName}...`);
    
    // Get all trades with tickers
    const trades = await prisma.trade.findMany({
      where: {
        politician_id: politicianId,
        Issuer: {
          ticker: { not: null }
        }
      },
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
      console.log(`  ⚠️  No trades with tickers found`);
      return null;
    }

    // Generate last 12 months
    const endDate = new Date();
    const dates = [];
    const startDate = new Date(endDate);
    startDate.setMonth(startDate.getMonth() - 12);
    startDate.setDate(1);
    
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate).toISOString().split('T')[0]);
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    const politicianReturns = [];
    const sp500Returns = [];
    
    // Get S&P 500 starting price (with retry and better error handling)
    let sp500StartPrice = null;
    let retries = 3;
    while (retries > 0 && !sp500StartPrice) {
      sp500StartPrice = await getSP500Price(startDate);
      if (!sp500StartPrice) {
        retries--;
        console.log(`  ⚠️  S&P 500 start price fetch failed, retries left: ${retries}`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
      }
    }
    
    if (!sp500StartPrice) {
      console.log(`  ⚠️  Could not fetch S&P 500 start price, using fallback calculation`);
    }
    
    // Process each month
    for (let i = 0; i < dates.length; i++) {
      const monthEnd = new Date(dates[i]);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthEnd.setDate(0);
      
      const tradesUpToMonth = trades.filter(t => new Date(t.traded_at) <= monthEnd);
      
      if (tradesUpToMonth.length === 0) {
        politicianReturns.push(i > 0 ? politicianReturns[i - 1] : 0);
        // For S&P 500, calculate from start date even if no trades
        if (sp500StartPrice) {
          const sp500MonthEndPrice = await getSP500Price(monthEnd);
          if (sp500MonthEndPrice) {
            const sp500Return = ((sp500MonthEndPrice - sp500StartPrice) / sp500StartPrice) * 100;
            sp500Returns.push(sp500Return);
          } else {
            sp500Returns.push(i > 0 ? sp500Returns[i - 1] : 0);
          }
        } else {
          sp500Returns.push(i > 0 ? sp500Returns[i - 1] : 0);
        }
        continue;
      }

      // Calculate portfolio return
      let totalWeightedReturn = 0;
      let totalWeight = 0;
      
      // Process last 50 trades for performance
      const tradesToProcess = tradesUpToMonth.slice(-50);
      
      for (const trade of tradesToProcess) {
        if (!trade.Issuer?.ticker) continue;
        
        try {
          const ticker = trade.Issuer.ticker;
          const tradeDate = new Date(trade.traded_at);
          
          const tradePrice = await getPriceOnDate(ticker, tradeDate);
          const monthEndPrice = await getPriceOnDate(ticker, monthEnd);
          
          if (tradePrice && monthEndPrice && tradePrice > 0) {
            const returnPct = ((monthEndPrice - tradePrice) / tradePrice) * 100;
            
            let weight = 1;
            if (trade.size_max) {
              weight = Number(trade.size_max) / 1000000;
            } else if (trade.size_min) {
              weight = Number(trade.size_min) / 1000000;
            }
            
            const multiplier = trade.type?.toLowerCase().includes('sell') ? -1 : 1;
            const adjustedReturn = returnPct * multiplier;
            
            totalWeightedReturn += adjustedReturn * weight;
            totalWeight += weight;
          }
        } catch (error) {
          // Skip on error
        }
      }

      const avgReturn = totalWeight > 0 ? totalWeightedReturn / totalWeight : (i > 0 ? politicianReturns[i - 1] : 0);
      politicianReturns.push(avgReturn);

      // S&P 500 return (with retry)
      if (sp500StartPrice) {
        let sp500MonthEndPrice = null;
        let retries = 2;
        while (retries > 0 && !sp500MonthEndPrice) {
          sp500MonthEndPrice = await getSP500Price(monthEnd);
          if (!sp500MonthEndPrice) {
            retries--;
            await new Promise(resolve => setTimeout(resolve, 500)); // Wait 0.5 seconds before retry
          }
        }
        
        if (sp500MonthEndPrice) {
          const sp500Return = ((sp500MonthEndPrice - sp500StartPrice) / sp500StartPrice) * 100;
          sp500Returns.push(sp500Return);
        } else {
          // Use previous value if fetch fails
          sp500Returns.push(i > 0 ? sp500Returns[i - 1] : 0);
        }
      } else {
        // If we don't have start price, try to calculate from first available price
        if (i === 0) {
          // Try to get current S&P 500 price as baseline
          const currentSP500 = await getSP500Price(new Date());
          if (currentSP500) {
            sp500StartPrice = currentSP500;
            sp500Returns.push(0); // Start at 0%
          } else {
            sp500Returns.push(0);
          }
        } else {
          sp500Returns.push(i > 0 ? sp500Returns[i - 1] : 0);
        }
      }
    }

    return {
      dates,
      politician_returns: politicianReturns,
      sp500_returns: sp500Returns,
      calculated_at: new Date().toISOString()
    };
    
  } catch (error) {
    console.error(`  ❌ Error calculating for ${politicianName}:`, error);
    return null;
  }
}

// Main function
async function precalculateAllPortfolios() {
  try {
    console.log('🚀 Starting portfolio data pre-calculation...\n');
    
    // Get all politicians with trades
    const politicians = await prisma.politician.findMany({
      where: {
        Trade: {
          some: {
            Issuer: {
              ticker: { not: null }
            }
          }
        }
      },
      include: {
        _count: {
          select: { Trade: true }
        }
      },
      orderBy: {
        Trade: { _count: 'desc' }
      }
    });

    console.log(`Found ${politicians.length} politicians with trades\n`);

    const results = new Map();
    let processed = 0;
    let successCount = 0;
    let errorCount = 0;

    for (const politician of politicians) {
      processed++;
      console.log(`[${processed}/${politicians.length}] Processing ${politician.name}...`);
      
      const data = await calculatePortfolioData(politician.id, politician.name);
      
      if (data) {
        results.set(politician.id, {
          politician_id: politician.id,
          politician_name: politician.name,
          data: data,
          updated_at: new Date()
        });
        successCount++;
        console.log(`  ✅ Calculated ${data.dates.length} months of data`);
      } else {
        errorCount++;
      }
      
      // Save to file periodically (every 10 politicians)
      if (processed % 10 === 0) {
        await saveResults(results);
        console.log(`\n💾 Saved progress (${processed}/${politicians.length})`);
      }
    }

    // Final save
    await saveResults(results);

    console.log('\n' + '='.repeat(80));
    console.log('✅ Pre-calculation complete!');
    console.log(`📊 Processed: ${processed} politicians`);
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`💾 Results saved to: portfolio_cache.json`);
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error in pre-calculation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Save results to JSON file
async function saveResults(results) {
  const fs = require('fs');
  const data = Object.fromEntries(results);
  fs.writeFileSync(
    'portfolio_cache.json',
    JSON.stringify(data, null, 2)
  );
}

// Run if called directly
if (require.main === module) {
  precalculateAllPortfolios().catch(console.error);
}

module.exports = { precalculateAllPortfolios, calculatePortfolioData };

