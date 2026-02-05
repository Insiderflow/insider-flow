#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
// Use built-in fetch (Node 18+) or axios as fallback
const axios = require('axios');
const prisma = new PrismaClient();

// Fetch wrapper that works with both built-in fetch and axios
async function fetchUrl(url) {
  // Try built-in fetch first (Node 18+)
  if (typeof globalThis.fetch === 'function') {
    const response = await globalThis.fetch(url);
    return { json: async () => await response.json(), ok: response.ok };
  }
  // Fallback to axios
  try {
    const response = await axios.get(url);
    return { json: async () => response.data, ok: true };
  } catch (error) {
    return { json: async () => null, ok: false };
  }
}

// Get stock price from Yahoo Finance API (free, no auth needed)
async function getStockPrice(ticker, date) {
  if (!ticker) return null;
  
  try {
    // Yahoo Finance historical data endpoint
    const timestamp = Math.floor(date.getTime() / 1000);
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?period1=${timestamp}&period2=${timestamp + 86400}&interval=1d`;
    
    const response = await fetchUrl(url);
    const data = await response.json();
    
    if (data.chart && data.chart.result && data.chart.result[0]) {
      const result = data.chart.result[0];
      if (result.indicators && result.indicators.quote && result.indicators.quote[0]) {
        const quotes = result.indicators.quote[0];
        if (quotes.close && quotes.close.length > 0) {
          return quotes.close[quotes.close.length - 1];
        }
      }
    }
    return null;
  } catch (error) {
    return null;
  }
}

// Get current stock price
async function getCurrentStockPrice(ticker) {
  if (!ticker) return null;
  
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`;
    const response = await fetchUrl(url);
    const data = await response.json();
    
    if (data.chart && data.chart.result && data.chart.result[0]) {
      const result = data.chart.result[0];
      if (result.meta && result.meta.regularMarketPrice) {
        return result.meta.regularMarketPrice;
      }
    }
    return null;
  } catch (error) {
    return null;
  }
}

// Get S&P 500 return for a date range
async function getSP500Return(startDate, endDate) {
  try {
    const startTimestamp = Math.floor(startDate.getTime() / 1000);
    const endTimestamp = Math.floor(endDate.getTime() / 1000);
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/%5EGSPC?period1=${startTimestamp}&period2=${endTimestamp}&interval=1d`;
    
    const response = await fetchUrl(url);
    const data = await response.json();
    
    if (data.chart && data.chart.result && data.chart.result[0]) {
      const result = data.chart.result[0];
      if (result.indicators && result.indicators.quote && result.indicators.quote[0]) {
        const quotes = result.indicators.quote[0];
        if (quotes.close && quotes.close.length > 0) {
          const startPrice = quotes.close[0];
          const endPrice = quotes.close[quotes.close.length - 1];
          return ((endPrice - startPrice) / startPrice) * 100;
        }
      }
    }
    return null;
  } catch (error) {
    console.error('Error fetching S&P 500 data:', error.message);
    return null;
  }
}

// Cache for prices to avoid duplicate API calls
const priceCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getCachedPrice(ticker, date, isCurrent = false) {
  const cacheKey = `${ticker}_${isCurrent ? 'current' : date.toISOString().split('T')[0]}`;
  const cached = priceCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    return cached.price;
  }
  
  const price = isCurrent ? await getCurrentStockPrice(ticker) : await getStockPrice(ticker, date);
  if (price !== null) {
    priceCache.set(cacheKey, { price, timestamp: Date.now() });
  }
  return price;
}

// Rate limiting helper
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function calculatePoliticianPerformance() {
  try {
    console.log('📊 Calculating politicians who outperformed S&P 500 in 2024...\n');
    
    const startOf2024 = new Date('2024-01-01T00:00:00.000Z');
    const endOf2024 = new Date('2024-12-31T23:59:59.999Z');
    const today = new Date();
    const endDate = today > endOf2024 ? endOf2024 : today;
    
    console.log(`📅 Date range: ${startOf2024.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}\n`);
    
    // Get S&P 500 return for 2024
    console.log('📈 Fetching S&P 500 performance...');
    const sp500Return = await getSP500Return(startOf2024, endDate);
    
    if (sp500Return === null) {
      console.log('⚠️  Could not fetch S&P 500 data. Using fallback calculation...');
      // S&P 500 returned approximately 26.3% in 2024
      const sp500ReturnFallback = 26.3;
      console.log(`📊 S&P 500 Return (2024): ${sp500ReturnFallback.toFixed(2)}%\n`);
    } else {
      console.log(`📊 S&P 500 Return (2024): ${sp500Return.toFixed(2)}%\n`);
    }
    
    const benchmarkReturn = sp500Return !== null ? sp500Return : 26.3;
    
    // Get all trades from 2024
    const trades = await prisma.trade.findMany({
      where: {
        traded_at: {
          gte: startOf2024,
          lte: endDate
        },
        Issuer: {
          ticker: {
            not: null
          }
        }
      },
      include: {
        Politician: {
          select: {
            id: true,
            name: true,
            party: true,
            chamber: true,
            state: true
          }
        },
        Issuer: {
          select: {
            id: true,
            name: true,
            ticker: true
          }
        }
      }
    });
    
    console.log(`Found ${trades.length} trades with tickers in 2024\n`);
    
    // Group trades by politician
    const politicianTrades = new Map();
    
    trades.forEach(trade => {
      const politicianId = trade.politician_id;
      
      if (!politicianTrades.has(politicianId)) {
        politicianTrades.set(politicianId, {
          politician: trade.Politician,
          trades: []
        });
      }
      
      politicianTrades.get(politicianId).trades.push(trade);
    });
    
    // Filter to only politicians with at least 5 trades with valid tickers to save time
    const filteredPoliticians = Array.from(politicianTrades.entries())
      .filter(([_, data]) => {
        const validTrades = data.trades.filter(t => t.Issuer.ticker).length;
        return validTrades >= 5;
      })
      .sort(([_, a], [__, b]) => b.trades.length - a.trades.length)
      .slice(0, 50); // Process top 50 by trade count
    
    console.log(`Calculating returns for top ${filteredPoliticians.length} politicians (with at least 5 trades)...\n`);
    console.log('⏳ This may take a while due to API rate limiting...\n');
    
    // Calculate performance for each politician
    const politicianPerformance = [];
    let processed = 0;
    
    for (const [politicianId, data] of filteredPoliticians) {
      processed++;
      console.log(`Processing ${processed}/${filteredPoliticians.length}: ${data.politician.name} (${data.trades.length} trades)...`);
      const { politician, trades } = data;
      
      // Sample up to 50 trades per politician to speed up calculation
      // For politicians with many trades, we'll sample to get a representative performance
      const tradesToProcess = trades.length > 50 
        ? trades.sort(() => Math.random() - 0.5).slice(0, 50) 
        : trades;
      
      let totalReturn = 0;
      let totalValue = 0;
      let validTrades = 0;
      
      // Calculate weighted return for each trade
      for (const trade of tradesToProcess) {
        if (!trade.Issuer.ticker) continue;
        
        try {
          // Get current price and trade date price
          const ticker = trade.Issuer.ticker;
          const tradeDate = trade.traded_at;
          
          // For simplicity, we'll use a simplified calculation
          // In production, you'd fetch historical prices for the trade date
          // and current prices to calculate actual returns
          
          // Estimate trade value
          let tradeValue = 0;
          if (trade.size_max) {
            tradeValue = Number(trade.size_max);
          } else if (trade.size_min) {
            tradeValue = Number(trade.size_min);
          } else if (trade.price) {
            tradeValue = Number(trade.price) * 10000; // Estimate
          }
          
          if (tradeValue === 0) continue;
          
          // Get historical price on trade date and current price (with caching and rate limiting)
          const tradePrice = await getCachedPrice(ticker, tradeDate, false);
          await sleep(100); // Rate limit: 100ms between requests
          const currentPrice = await getCachedPrice(ticker, tradeDate, true);
          
          if (tradePrice && currentPrice && tradePrice > 0) {
            const returnPct = ((currentPrice - tradePrice) / tradePrice) * 100;
            
            // Adjust for buy/sell
            // For buys: positive return is good, for sells: negative return is good (sold before drop)
            const multiplier = trade.type?.toLowerCase().includes('sell') ? -1 : 1;
            const tradeReturn = returnPct * multiplier;
            
            totalReturn += tradeReturn * (tradeValue / 1000000); // Weight by value
            totalValue += tradeValue;
            validTrades++;
          }
          
          // Rate limiting
          if (validTrades % 10 === 0) {
            await sleep(500); // Pause every 10 trades
          }
        } catch (error) {
          // Skip this trade
          continue;
        }
      }
      
      if (validTrades === 0) continue;
      
      // Calculate weighted average return
      const avgReturn = totalValue > 0 ? (totalReturn / totalValue) * 1000000 : 0;
      
      politicianPerformance.push({
        name: politician.name,
        party: politician.party,
        chamber: politician.chamber,
        state: politician.state,
        return: avgReturn,
        totalValue: totalValue,
        tradeCount: validTrades,
        outperformance: avgReturn - benchmarkReturn
      });
    }
    
    // Sort by outperformance
    politicianPerformance.sort((a, b) => b.outperformance - a.outperformance);
    
    // Get top 3 who outperformed
    const top3 = politicianPerformance
      .filter(p => p.outperformance > 0)
      .slice(0, 3);
    
    if (top3.length === 0) {
      console.log('⚠️  No politicians outperformed the S&P 500 in 2024.\n');
      console.log('Top 3 closest to benchmark:');
      politicianPerformance.slice(0, 3).forEach((p, i) => {
        console.log(`${i + 1}. ${p.name} - Return: ${p.return.toFixed(2)}% (${p.outperformance > 0 ? '+' : ''}${p.outperformance.toFixed(2)}% vs S&P 500)`);
      });
    } else {
      console.log('🏆 TOP 3 POLITICIANS WHO OUTPERFORMED S&P 500 IN 2024:\n');
      console.log('═'.repeat(80));
      
      top3.forEach((politician, index) => {
        console.log(`\n${index + 1}. ${politician.name}`);
        console.log(`   ${politician.party || 'N/A'} | ${politician.chamber || 'N/A'} | ${politician.state || 'N/A'}`);
        console.log(`   📈 Portfolio Return: ${politician.return.toFixed(2)}%`);
        console.log(`   📊 S&P 500 Return: ${benchmarkReturn.toFixed(2)}%`);
        console.log(`   🎯 Outperformance: +${politician.outperformance.toFixed(2)}%`);
        console.log(`   💰 Total Trade Value: $${politician.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
        console.log(`   📉 Number of Trades: ${politician.tradeCount}`);
      });
      
      console.log('\n' + '═'.repeat(80));
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

calculatePoliticianPerformance().catch(console.error);

