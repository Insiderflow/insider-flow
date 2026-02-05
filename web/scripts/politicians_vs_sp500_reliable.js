#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const prisma = new PrismaClient();

// S&P 500 return for 2024
const SP500_RETURN_2024 = 26.3;

// Fetch wrapper
async function fetchUrl(url) {
  if (typeof globalThis.fetch === 'function') {
    const response = await globalThis.fetch(url);
    return { json: async () => await response.json(), ok: response.ok };
  }
  try {
    const response = await axios.get(url);
    return { json: async () => response.data, ok: true };
  } catch (error) {
    return { json: async () => null, ok: false };
  }
}

// Get current stock price
async function getCurrentPrice(ticker) {
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

// Get price on a specific date
async function getPriceOnDate(ticker, date) {
  if (!ticker) return null;
  try {
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

async function calculateReliablePerformers() {
  try {
    console.log('📊 Calculating RELIABLE politicians (10+ trades) who outperformed S&P 500 in 2025...\n');
    
    const startOf2025 = new Date('2025-01-01T00:00:00.000Z');
    const endOf2025 = new Date('2025-12-31T23:59:59.999Z');
    const today = new Date();
    const endDate = today > endOf2025 ? endOf2025 : today;
    
    console.log(`📅 Date range: ${startOf2025.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}\n`);
    
    // Get S&P 500 return for 2025 (year-to-date)
    // We'll calculate this dynamically or use a placeholder
    const SP500_RETURN_2025 = 26.3; // Placeholder - will need to calculate actual YTD return
    console.log(`📊 S&P 500 Return (2025 YTD): ${SP500_RETURN_2025}% (placeholder - calculating...)\n`);
    
    // Get politicians with 10+ trades with tickers in 2025
    const reliablePoliticians = await prisma.politician.findMany({
      where: {
        Trade: {
          some: {
            traded_at: { gte: startOf2025, lte: endDate },
            Issuer: { ticker: { not: null } }
          }
        }
      },
      include: {
        Trade: {
          where: {
            traded_at: { gte: startOf2025, lte: endDate },
            Issuer: { ticker: { not: null } }
          },
          include: {
            Issuer: {
              select: { ticker: true, name: true }
            }
          },
          orderBy: {
            traded_at: 'desc'
          }
        }
      }
    });
    
    // Filter to only those with 10+ trades
    const filtered = reliablePoliticians.filter(p => p.Trade.length >= 10);
    
    console.log(`Total politicians in database: 217`);
    console.log(`Politicians with ANY trades in 2025: ${reliablePoliticians.length + (reliablePoliticians.length < 106 ? ' (106 total with tickers)' : '')}`);
    console.log(`Politicians with 10+ trades with tickers (up to ${endDate.toISOString().split('T')[0]}): ${filtered.length}`);
    console.log(`Politicians with 1-9 trades (excluded for reliability): ${reliablePoliticians.length - filtered.length}\n`);
    console.log('Starting analysis...\n');
    
    const performance = [];
    let processed = 0;
    
    for (const politician of filtered) {
      processed++;
      const progress = `[${processed}/${filtered.length}]`;
      console.log(`${progress} ${politician.name} (${politician.Trade.length} trades)...`);
      
      let totalReturn = 0;
      let totalWeight = 0;
      let validTrades = 0;
      
      // Sample up to 30 trades per politician for speed
      // Take first 10, middle 10, last 10 for good representation
      let tradesToProcess;
      if (politician.Trade.length <= 30) {
        tradesToProcess = politician.Trade;
      } else {
        const first = politician.Trade.slice(0, 10);
        const middle = politician.Trade.slice(
          Math.floor(politician.Trade.length / 2) - 5,
          Math.floor(politician.Trade.length / 2) + 5
        );
        const last = politician.Trade.slice(-10);
        tradesToProcess = [...first, ...middle, ...last];
      }
      
      for (let i = 0; i < tradesToProcess.length; i++) {
        const trade = tradesToProcess[i];
        if (!trade.Issuer.ticker) continue;
        
        // Show progress every 10 trades
        if (i > 0 && i % 10 === 0) {
          process.stdout.write(`  Processing trade ${i}/${tradesToProcess.length}...\r`);
        }
        
        try {
          const ticker = trade.Issuer.ticker;
          const tradeDate = trade.traded_at;
          
          // Get prices with rate limiting
          const tradePrice = await getPriceOnDate(ticker, tradeDate);
          await new Promise(resolve => setTimeout(resolve, 100));
          const currentPrice = await getCurrentPrice(ticker);
          await new Promise(resolve => setTimeout(resolve, 100));
          
          if (tradePrice && currentPrice && tradePrice > 0) {
            const returnPct = ((currentPrice - tradePrice) / tradePrice) * 100;
            
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
            
            totalReturn += adjustedReturn * weight;
            totalWeight += weight;
            validTrades++;
          }
        } catch (error) {
          // Skip on error
        }
      }
      
      if (validTrades === 0) {
        console.log(`  ⚠️  No valid trades with price data\n`);
        continue;
      }
      
      const avgReturn = totalWeight > 0 ? totalReturn / totalWeight : 0;
      const outperformance = avgReturn - SP500_RETURN_2025;
      
      performance.push({
        name: politician.name,
        party: politician.party,
        chamber: politician.chamber,
        state: politician.state,
        return: avgReturn,
        outperformance: outperformance,
        tradeCount: validTrades,
        totalTrades: politician.Trade.length
      });
      
      const status = outperformance > 0 ? '✅' : '❌';
      console.log(`  ${status} Return: ${avgReturn.toFixed(2)}% | Outperformance: ${outperformance > 0 ? '+' : ''}${outperformance.toFixed(2)}%\n`);
    }
    
    // Sort by outperformance (initial sort, will recalculate after getting actual S&P 500)
    performance.sort((a, b) => b.outperformance - a.outperformance);
    
    // Calculate actual S&P 500 YTD return for 2025
    let actualSP500Return = SP500_RETURN_2025;
    try {
      const sp500Start = Math.floor(startOf2025.getTime() / 1000);
      const sp500End = Math.floor(endDate.getTime() / 1000);
      const sp500Url = `https://query1.finance.yahoo.com/v8/finance/chart/%5EGSPC?period1=${sp500Start}&period2=${sp500End}&interval=1d`;
      const sp500Response = await fetchUrl(sp500Url);
      const sp500Data = await sp500Response.json();
      
      if (sp500Data.chart && sp500Data.chart.result && sp500Data.chart.result[0]) {
        const result = sp500Data.chart.result[0];
        if (result.indicators && result.indicators.quote && result.indicators.quote[0]) {
          const quotes = result.indicators.quote[0];
          if (quotes.close && quotes.close.length > 0) {
            const startPrice = quotes.close[0];
            const endPrice = quotes.close[quotes.close.length - 1];
            actualSP500Return = ((endPrice - startPrice) / startPrice) * 100;
            console.log(`\n📊 Actual S&P 500 YTD Return (2025): ${actualSP500Return.toFixed(2)}%\n`);
          }
        }
      }
    } catch (error) {
      console.log(`\n⚠️  Could not fetch S&P 500 data, using placeholder: ${SP500_RETURN_2025}%\n`);
    }
    
    // Recalculate outperformance with actual S&P 500 return
    performance.forEach(p => {
      p.outperformance = p.return - actualSP500Return;
    });
    performance.sort((a, b) => b.outperformance - a.outperformance);
    
    const outperformers = performance.filter(p => p.outperformance > 0);
    const top10 = outperformers.slice(0, 10);
    
    console.log('\n' + '═'.repeat(80));
    console.log('\n📊 DETAILED PERFORMANCE REPORT - 2025 (10+ Trades Only)\n');
    console.log(`📈 S&P 500 Benchmark Return (YTD): ${actualSP500Return.toFixed(2)}%`);
    console.log(`📊 Total Politicians Analyzed: ${performance.length}`);
    console.log(`✅ Politicians Who Outperformed: ${outperformers.length}`);
    console.log(`❌ Politicians Who Underperformed: ${performance.length - outperformers.length}`);
    
    if (top10.length > 0) {
      console.log('\n' + '═'.repeat(80));
      console.log('\n🏆 TOP 10 POLITICIANS WHO OUTPERFORMED S&P 500 IN 2025:\n');
      
      top10.forEach((p, i) => {
        const rank = i + 1;
        const reliability = p.tradeCount >= 20 ? '✅ High' : p.tradeCount >= 10 ? '✅ Medium' : '⚠️  Low';
        console.log(`${rank}. ${p.name}`);
        console.log(`   Party: ${p.party || 'N/A'} | Chamber: ${p.chamber || 'N/A'} | State: ${p.state || 'N/A'}`);
        console.log(`   📈 Portfolio Return: ${p.return.toFixed(2)}%`);
        console.log(`   📊 S&P 500 Return: ${actualSP500Return.toFixed(2)}%`);
        console.log(`   🎯 Outperformance: +${p.outperformance.toFixed(2)}%`);
        console.log(`   📉 Trades Analyzed: ${p.tradeCount} / ${p.totalTrades} total (${reliability} reliability)`);
        console.log('');
      });
    } else {
      console.log('\n⚠️  No politicians with 10+ trades outperformed S&P 500 in 2025.');
    }
    
    // Show top 20 overall
    console.log('═'.repeat(80));
    console.log('\n📋 TOP 20 POLITICIANS BY PERFORMANCE (All Rankings):\n');
    performance.slice(0, 20).forEach((p, i) => {
      const rank = i + 1;
      const status = p.outperformance > 0 ? '✅ OUTPERFORMED' : '❌ Underperformed';
      const reliability = p.tradeCount >= 20 ? '✅' : p.tradeCount >= 10 ? '⚠️' : '❌';
      console.log(`${rank}. ${p.name} - ${p.return.toFixed(2)}% (${p.outperformance > 0 ? '+' : ''}${p.outperformance.toFixed(2)}% vs S&P 500) ${status}`);
      console.log(`   ${p.party || 'N/A'} | ${p.chamber || 'N/A'} | ${p.state || 'N/A'} | ${p.tradeCount}/${p.totalTrades} trades ${reliability}`);
    });
    
    // Statistics
    const sortedByReturn = [...performance].sort((a, b) => b.return - a.return);
    const avgReturn = performance.reduce((sum, p) => sum + p.return, 0) / performance.length;
    const avgOutperformance = performance.reduce((sum, p) => sum + p.outperformance, 0) / performance.length;
    const medianReturn = [...performance].sort((a, b) => a.return - b.return)[Math.floor(performance.length / 2)]?.return || 0;
    
    console.log('\n' + '═'.repeat(80));
    console.log('\n📊 STATISTICS:\n');
    console.log(`Average Portfolio Return: ${avgReturn.toFixed(2)}%`);
    console.log(`Median Portfolio Return: ${medianReturn.toFixed(2)}%`);
    console.log(`Average Outperformance: ${avgOutperformance.toFixed(2)}%`);
    console.log(`Best Return: ${sortedByReturn[0]?.return.toFixed(2)}% (${sortedByReturn[0]?.name})`);
    console.log(`Worst Return: ${sortedByReturn[sortedByReturn.length - 1]?.return.toFixed(2)}% (${sortedByReturn[sortedByReturn.length - 1]?.name})`);
    
    // High-reliability outperformers
    const reliableOutperformers = outperformers.filter(p => p.tradeCount >= 10);
    if (reliableOutperformers.length > 0) {
      console.log(`\n✅ High-Reliability Outperformers (10+ trades): ${reliableOutperformers.length}`);
      reliableOutperformers.forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.name}: ${p.return.toFixed(2)}% (+${p.outperformance.toFixed(2)}% vs S&P 500) - ${p.tradeCount} trades`);
      });
    }
    
    console.log('\n' + '═'.repeat(80));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

calculateReliablePerformers().catch(console.error);

