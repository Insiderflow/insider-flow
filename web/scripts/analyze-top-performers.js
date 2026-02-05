#!/usr/bin/env node

const fs = require('fs');

// Load cache file
const cachePath = 'portfolio_cache.json';
if (!fs.existsSync(cachePath)) {
  console.error('❌ portfolio_cache.json not found. Run precalculate-portfolio-data.js first.');
  process.exit(1);
}

const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));

// Analyze all politicians
const performers = [];

for (const [id, data] of Object.entries(cache)) {
  if (!data.data || !data.data.politician_returns) continue;
  
  const returns = data.data.politician_returns;
  const sp500Returns = data.data.sp500_returns;
  
  // Get latest non-zero return (skip trailing zeros)
  let latestReturn = 0;
  let latestSP500 = 0;
  for (let i = returns.length - 1; i >= 0; i--) {
    if (returns[i] !== 0 || i === 0) {
      latestReturn = returns[i];
      latestSP500 = sp500Returns[i] || 0;
      break;
    }
  }
  const outperformance = latestReturn - latestSP500;
  
  // Get max return
  const maxReturn = Math.max(...returns);
  const maxSP500 = Math.max(...sp500Returns);
  
  // Calculate average return
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const avgSP500 = sp500Returns.reduce((a, b) => a + b, 0) / sp500Returns.length;
  
  performers.push({
    name: data.politician_name,
    id: id,
    latestReturn: latestReturn,
    latestSP500: latestSP500,
    outperformance: outperformance,
    maxReturn: maxReturn,
    avgReturn: avgReturn,
    avgOutperformance: avgReturn - avgSP500,
    months: returns.length
  });
}

// Sort by latest return
performers.sort((a, b) => b.latestReturn - a.latestReturn);

console.log('\n' + '='.repeat(80));
console.log('🏆 TOP 20 PERFORMERS IN 2025 (Based on Latest Portfolio Return)\n');
console.log('='.repeat(80) + '\n');

performers.slice(0, 20).forEach((p, i) => {
  const rank = i + 1;
  const status = p.outperformance > 0 ? '✅' : '❌';
  console.log(`${rank}. ${p.name}`);
  console.log(`   Latest Return: ${p.latestReturn.toFixed(2)}%`);
  console.log(`   S&P 500: ${p.latestSP500.toFixed(2)}%`);
  console.log(`   Outperformance: ${p.outperformance > 0 ? '+' : ''}${p.outperformance.toFixed(2)}% ${status}`);
  console.log(`   Average Return: ${p.avgReturn.toFixed(2)}%`);
  console.log(`   Max Return: ${p.maxReturn.toFixed(2)}%`);
  console.log('');
});

// Sort by outperformance
performers.sort((a, b) => b.outperformance - a.outperformance);

console.log('='.repeat(80));
console.log('\n🎯 TOP 20 BY OUTPERFORMANCE vs S&P 500\n');
console.log('='.repeat(80) + '\n');

performers.slice(0, 20).forEach((p, i) => {
  const rank = i + 1;
  const status = p.outperformance > 0 ? '✅' : '❌';
  console.log(`${rank}. ${p.name}`);
  console.log(`   Portfolio: ${p.latestReturn.toFixed(2)}% | S&P 500: ${p.latestSP500.toFixed(2)}%`);
  console.log(`   Outperformance: ${p.outperformance > 0 ? '+' : ''}${p.outperformance.toFixed(2)}% ${status}`);
  console.log('');
});

// Statistics
const outperformers = performers.filter(p => p.outperformance > 0);
const avgReturn = performers.reduce((sum, p) => sum + p.latestReturn, 0) / performers.length;
const avgOutperformance = performers.reduce((sum, p) => sum + p.outperformance, 0) / performers.length;

console.log('='.repeat(80));
console.log('\n📊 STATISTICS\n');
console.log('='.repeat(80));
console.log(`Total Politicians Analyzed: ${performers.length}`);
console.log(`Politicians Outperforming S&P 500: ${outperformers.length} (${(outperformers.length / performers.length * 100).toFixed(1)}%)`);
console.log(`Average Portfolio Return: ${avgReturn.toFixed(2)}%`);
console.log(`Average Outperformance: ${avgOutperformance.toFixed(2)}%`);
console.log(`Best Performer: ${performers[0].name} (${performers[0].latestReturn.toFixed(2)}%)`);
console.log(`Best Outperformer: ${outperformers[0]?.name || 'None'} (${outperformers[0]?.outperformance.toFixed(2) || 0}%)`);
console.log('='.repeat(80) + '\n');

