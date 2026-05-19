#!/usr/bin/env node

/**
 * Fallback scraper — same parser as scrape_trades_fixed.js, fewer pages.
 */
process.env.SCRAPE_MAX_PAGES = process.env.SCRAPE_MAX_PAGES || '8';

const path = require('path');
const fs = require('fs');
const { scrapeTrades } = require('./scrape_trades_fixed');

async function scrapeLatestTrades() {
  const result = await scrapeTrades();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `trades_pages_5_${timestamp}.json`;
  const filepath = path.join(__dirname, '..', filename);
  fs.writeFileSync(filepath, JSON.stringify(result.trades, null, 2));
  try {
    fs.unlinkSync(path.join(__dirname, '..', path.basename(result.filename)));
  } catch {
    /* primary filename optional */
  }
  console.log(`💾 Saved ${result.trades.length} trades to ${filename}`);
  return { filename, trades: result.trades };
}

if (require.main === module) {
  scrapeLatestTrades()
    .then((result) => {
      console.log(`🎉 Successfully scraped ${result.trades.length} trades`);
      console.log(`📁 File saved as: ${result.filename}`);
    })
    .catch((error) => {
      console.error('💥 Scraping failed:', error);
      process.exit(1);
    });
}

module.exports = { scrapeLatestTrades };
