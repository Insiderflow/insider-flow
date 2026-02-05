#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const prisma = new PrismaClient();

// Simplified: Get S&P 500 return for 2024 (known value)
const SP500_RETURN_2024 = 26.3; // S&P 500 returned ~26.3% in 2024

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

// Get current stock price (simplified - just current price)
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

async function calculateTopPerformers() {
  try {
    console.log('📊 Finding top 3 politicians who outperformed S&P 500 in 2024...\n');
    
    const startOf2024 = new Date('2024-01-01T00:00:00.000Z');
    const endOf2024 = new Date('2024-12-31T23:59:59.999Z');
    const today = new Date();
    const endDate = today > endOf2024 ? endOf2024 : today;
    
    console.log(`📅 Date range: ${startOf2024.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}\n`);
    console.log(`📊 S&P 500 Return (2024): ${SP500_RETURN_2024}%\n`);
    
    // Get ALL politicians with trades in 2024 (not just top 30)
    const allPoliticians = await prisma.politician.findMany({
      where: {
        Trade: {
          some: {
            traded_at: { gte: startOf2024, lte: endDate },
            Issuer: { ticker: { not: null } }
          }
        }
      },
      include: {
        _count: {
          select: { Trade: true }
        },
        Trade: {
          where: {
            traded_at: { gte: startOf2024, lte: endDate },
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
          // Don't limit - process all trades per politician
        }
      },
      orderBy: {
        Trade: { _count: 'desc' }
      }
    });
    
    console.log(`Processing ${allPoliticians.length} politicians with trades in 2024...\n`);
    
    const performance = [];
    
    for (const politician of allPoliticians) {
      if (politician.Trade.length === 0) continue;
      
      const politicianIndex = allPoliticians.indexOf(politician) + 1;
      console.log(`[${politicianIndex}/${allPoliticians.length}] Calculating: ${politician.name} (${politician.Trade.length} total trades, processing ${Math.min(politician.Trade.length, 50)} samples)...`);
      
      let totalReturn = 0;
      let totalWeight = 0;
      let validTrades = 0;
      
      // Process up to 50 trades per politician for balance between speed and accuracy
      // Sample trades evenly across the year for better representation
      const tradesToProcess = politician.Trade.length > 50 
        ? [
            ...politician.Trade.slice(0, 10), // First 10
            ...politician.Trade.slice(Math.floor(politician.Trade.length / 2) - 15, Math.floor(politician.Trade.length / 2) + 15), // Middle 30
            ...politician.Trade.slice(-10) // Last 10
          ]
        : politician.Trade;
      
      for (let i = 0; i < tradesToProcess.length; i++) {
        const trade = tradesToProcess[i];
        if (!trade.Issuer.ticker) continue;
        
        // Show progress every 5 trades
        if (i % 5 === 0 && i > 0) {
          process.stdout.write(`  ... ${i}/${tradesToProcess.length} trades processed\r`);
        }
        
        try {
          const ticker = trade.Issuer.ticker;
          const tradeDate = trade.traded_at;
          
          // Get prices
          const tradePrice = await getPriceOnDate(ticker, tradeDate);
          await new Promise(resolve => setTimeout(resolve, 150)); // Rate limit
          const currentPrice = await getCurrentPrice(ticker);
          await new Promise(resolve => setTimeout(resolve, 150)); // Rate limit
          
          if (tradePrice && currentPrice && tradePrice > 0) {
            const returnPct = ((currentPrice - tradePrice) / tradePrice) * 100;
            
            // Calculate trade weight
            let weight = 1;
            if (trade.size_max) {
              weight = Number(trade.size_max) / 1000000; // Normalize
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
          // Skip
        }
      }
      
      if (validTrades === 0) continue;
      
      const avgReturn = totalWeight > 0 ? totalReturn / totalWeight : 0;
      const outperformance = avgReturn - SP500_RETURN_2024;
      
      performance.push({
        name: politician.name,
        party: politician.party,
        chamber: politician.chamber,
        state: politician.state,
        return: avgReturn,
        outperformance: outperformance,
        tradeCount: validTrades
      });
      
      console.log(`  Return: ${avgReturn.toFixed(2)}% | Outperformance: ${outperformance > 0 ? '+' : ''}${outperformance.toFixed(2)}%\n`);
    }
    
    // Sort by outperformance
    performance.sort((a, b) => b.outperformance - a.outperformance);
    
    // Get all who outperformed
    const outperformers = performance.filter(p => p.outperformance > 0);
    const top10 = outperformers.slice(0, 10);
    
    console.log('\n' + '═'.repeat(80));
    console.log('\n📊 DETAILED PERFORMANCE REPORT - 2024\n');
    console.log(`📈 S&P 500 Benchmark Return: ${SP500_RETURN_2024}%`);
    console.log(`📊 Total Politicians Analyzed: ${performance.length}`);
    console.log(`✅ Politicians Who Outperformed: ${outperformers.length}`);
    console.log(`❌ Politicians Who Underperformed: ${performance.length - outperformers.length}`);
    
    if (top10.length > 0) {
      console.log('\n' + '═'.repeat(80));
      console.log('\n🏆 TOP 10 POLITICIANS WHO OUTPERFORMED S&P 500 IN 2024:\n');
      
      top10.forEach((p, i) => {
        const rank = i + 1;
        const reliability = p.tradeCount >= 10 ? '✅ High' : p.tradeCount >= 5 ? '⚠️  Medium' : '❌ Low';
        console.log(`${rank}. ${p.name}`);
        console.log(`   Party: ${p.party || 'N/A'} | Chamber: ${p.chamber || 'N/A'} | State: ${p.state || 'N/A'}`);
        console.log(`   📈 Portfolio Return: ${p.return.toFixed(2)}%`);
        console.log(`   📊 S&P 500 Return: ${SP500_RETURN_2024}%`);
        console.log(`   🎯 Outperformance: +${p.outperformance.toFixed(2)}%`);
        console.log(`   📉 Trades Analyzed: ${p.tradeCount} (${reliability} reliability)`);
        console.log('');
      });
    } else {
      console.log('\n⚠️  No politicians outperformed S&P 500 in 2024.');
    }
    
    // Show top 10 overall (including underperformers)
    console.log('═'.repeat(80));
    console.log('\n📋 TOP 10 POLITICIANS BY PERFORMANCE (All Rankings):\n');
    performance.slice(0, 10).forEach((p, i) => {
      const rank = i + 1;
      const status = p.outperformance > 0 ? '✅ OUTPERFORMED' : '❌ Underperformed';
      const reliability = p.tradeCount >= 10 ? '✅' : p.tradeCount >= 5 ? '⚠️' : '❌';
      console.log(`${rank}. ${p.name} - ${p.return.toFixed(2)}% (${p.outperformance > 0 ? '+' : ''}${p.outperformance.toFixed(2)}% vs S&P 500) ${status}`);
      console.log(`   ${p.party || 'N/A'} | ${p.chamber || 'N/A'} | ${p.state || 'N/A'} | ${p.tradeCount} trades ${reliability}`);
    });
    
    // Show worst performers
    console.log('\n' + '═'.repeat(80));
    console.log('\n📉 BOTTOM 5 PERFORMERS:\n');
    performance.slice(-5).reverse().forEach((p, i) => {
      console.log(`${i + 1}. ${p.name} - ${p.return.toFixed(2)}% (${p.outperformance.toFixed(2)}% vs S&P 500)`);
      console.log(`   ${p.party || 'N/A'} | ${p.chamber || 'N/A'} | ${p.state || 'N/A'} | ${p.tradeCount} trades`);
    });
    
    console.log('\n' + '═'.repeat(80));
    console.log('\n📊 STATISTICS:\n');
    const avgReturn = performance.reduce((sum, p) => sum + p.return, 0) / performance.length;
    const avgOutperformance = performance.reduce((sum, p) => sum + p.outperformance, 0) / performance.length;
    const medianReturn = performance.sort((a, b) => a.return - b.return)[Math.floor(performance.length / 2)]?.return || 0;
    
    const sortedByReturn = [...performance].sort((a, b) => b.return - a.return);
    const bestPerformer = sortedByReturn[0];
    const worstPerformer = sortedByReturn[sortedByReturn.length - 1];
    
    console.log(`Average Portfolio Return: ${avgReturn.toFixed(2)}%`);
    console.log(`Median Portfolio Return: ${medianReturn.toFixed(2)}%`);
    console.log(`Average Outperformance: ${avgOutperformance.toFixed(2)}%`);
    console.log(`Best Return: ${bestPerformer?.return.toFixed(2)}% (${bestPerformer?.name})`);
    console.log(`Worst Return: ${worstPerformer?.return.toFixed(2)}% (${worstPerformer?.name})`);
    
    // Show high-reliability outperformers (5+ trades)
    const reliableOutperformers = outperformers.filter(p => p.tradeCount >= 5);
    if (reliableOutperformers.length > 0) {
      console.log(`\n✅ High-Reliability Outperformers (5+ trades): ${reliableOutperformers.length}`);
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

calculateTopPerformers().catch(console.error);

