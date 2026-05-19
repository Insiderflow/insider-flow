#!/usr/bin/env node

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { parseCapitolDate, scrapeDateStats } = require('./capitol_date_parse');

const SELECTOR_VERSION = 'capitol_table_v3_trade_link';
const MAX_PAGES = Number(process.env.SCRAPE_MAX_PAGES || 45);
const PAGE_DELAY_MS = Number(process.env.SCRAPE_PAGE_DELAY_MS || 800);
const GOTO_TIMEOUT_MS = Number(process.env.SCRAPE_GOTO_TIMEOUT_MS || 45000);

function rowFromRaw(raw) {
  const politicianRaw = raw.politicianRaw || '';
  const politicianName = politicianRaw.replace(/(Republican|Democrat|Independent).*$/, '').trim();
  const politicianId = raw.politicianId;
  const issuerId = raw.issuerId;
  const tradeId = raw.tradeId;

  const issuerRaw = raw.issuerRaw || '';
  const tickerMatch = issuerRaw.match(/(.+?)([A-Z]{1,5}):US$/);
  let issuerName = tickerMatch ? tickerMatch[1].trim() : issuerRaw;
  const ticker = tickerMatch ? tickerMatch[2] : null;
  if (issuerName.endsWith('N/A')) issuerName = issuerName.replace(/N\/A$/, '').trim();

  const publishedAt = parseCapitolDate(raw.publishedAt);
  const tradedAt = parseCapitolDate(raw.tradedAt);
  const type = (raw.type || '').trim().toLowerCase();

  let sizeMin = null;
  let sizeMax = null;
  const sizeText = raw.sizeText || '';
  if (sizeText) {
    const sizeMatch = sizeText.match(/\$?(\d+(?:,\d{3})*(?:\.\d+)?)\s*[–-]\s*\$?(\d+(?:,\d{3})*(?:\.\d+)?)/);
    if (sizeMatch) {
      sizeMin = parseFloat(sizeMatch[1].replace(/,/g, ''));
      sizeMax = parseFloat(sizeMatch[2].replace(/,/g, ''));
    } else {
      const sizeMatchKMB = sizeText.match(/(\d+(?:\.\d+)?)([KMB]?)\s*[–-]\s*(\d+(?:\.\d+)?)([KMB]?)/);
      if (sizeMatchKMB) {
        const minVal = parseFloat(sizeMatchKMB[1]);
        const maxVal = parseFloat(sizeMatchKMB[3]);
        const minUnit = sizeMatchKMB[2];
        const maxUnit = sizeMatchKMB[4];
        sizeMin =
          minVal *
          (minUnit === 'K' ? 1000 : minUnit === 'M' ? 1000000 : minUnit === 'B' ? 1000000000 : 1);
        sizeMax =
          maxVal *
          (maxUnit === 'K' ? 1000 : maxUnit === 'M' ? 1000000 : maxUnit === 'B' ? 1000000000 : 1);
      }
    }
  }

  let price = null;
  const priceText = raw.priceText || '';
  if (priceText && priceText !== 'N/A') {
    const priceMatch = priceText.match(/\$?(\d+(?:\.\d+)?)/);
    if (priceMatch) price = parseFloat(priceMatch[1]);
  }

  let filedAfterDays = null;
  if (publishedAt && tradedAt) {
    const daysDiff = Math.floor(
      (new Date(publishedAt).getTime() - new Date(tradedAt).getTime()) / (1000 * 60 * 60 * 24),
    );
    if (daysDiff >= 0) filedAfterDays = daysDiff;
  }

  if (!politicianId || !issuerId || !tradeId || !tradedAt || !type) return null;

  return {
    tradeId,
    politicianId,
    politicianName,
    politicianChamber: null,
    issuerId,
    issuerName,
    ticker,
    publishedAt,
    tradedAt,
    filedAfterDays,
    owner: raw.owner,
    type,
    sizeMin,
    sizeMax,
    sizeText,
    price,
    detailUrl: raw.detailUrl,
  };
}

async function extractRawRows(page) {
  return page.evaluate(() => {
    const hrefId = (href) => {
      if (!href) return null;
      try {
        return new URL(href, window.location.href).pathname.split('/').filter(Boolean).pop() || null;
      } catch {
        return null;
      }
    };

    const rows = [];
    document.querySelectorAll('table tbody tr').forEach((row) => {
      const cells = row.querySelectorAll('td');
      if (cells.length < 9) return;

      const tradeLink =
        row.querySelector('a[href*="/trades/"]') ||
        cells[cells.length - 1]?.querySelector('a[href*="/trades/"]');

      rows.push({
        politicianRaw: cells[0].textContent.trim(),
        issuerRaw: cells[1].textContent.trim(),
        publishedAt: cells[2].textContent.trim(),
        tradedAt: cells[3].textContent.trim(),
        owner: cells[5].textContent.trim(),
        type: cells[6].textContent.trim(),
        sizeText: cells[7] ? cells[7].textContent.trim() : '',
        priceText: cells[8] ? cells[8].textContent.trim() : '',
        politicianId: hrefId(cells[0].querySelector('a')?.href),
        issuerId: hrefId(cells[1].querySelector('a')?.href),
        tradeId: hrefId(tradeLink?.href),
        detailUrl: tradeLink?.href || null,
      });
    });
    return rows;
  });
}

async function scrapeTrades() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const allTrades = [];
  const seenTradeIds = new Set();

  try {
    console.log('🚀 Starting to scrape latest trades from Capitol Trades...');
    console.log(`🧩 Selector version: ${SELECTOR_VERSION}`);
    console.log(`📄 Max pages: ${MAX_PAGES}`);

    for (let pageNum = 1; pageNum <= MAX_PAGES; pageNum++) {
      console.log(`📄 Scraping page ${pageNum}...`);
      const url = `https://www.capitoltrades.com/trades?page=${pageNum}`;
      const response = await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: GOTO_TIMEOUT_MS,
      });
      if (!response || response.status() >= 400) {
        console.log(`⚠️ Page ${pageNum} HTTP ${response?.status() ?? 'unknown'} — stopping pagination`);
        break;
      }

      const hasTable = await page
        .waitForSelector('table tbody tr', { timeout: 15000 })
        .then(() => true)
        .catch(() => false);
      if (!hasTable) {
        console.log(`⚠️ No trade table on page ${pageNum} — stopping pagination`);
        break;
      }

      const rawRows = await extractRawRows(page);
      let added = 0;
      for (const raw of rawRows) {
        const trade = rowFromRaw(raw);
        if (!trade || seenTradeIds.has(trade.tradeId)) continue;
        seenTradeIds.add(trade.tradeId);
        allTrades.push(trade);
        added++;
      }
      console.log(`✅ Page ${pageNum}: ${added} new trades (${rawRows.length} rows)`);

      if (pageNum < MAX_PAGES) await page.waitForTimeout(PAGE_DELAY_MS);
    }

    const stats = scrapeDateStats(allTrades);
    console.log(
      `📈 Scrape stats: ${stats.rowCount} trades, max published ${stats.maxPublished ?? 'n/a'}, max traded ${stats.maxTraded ?? 'n/a'}`,
    );

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `trades_scraped_${timestamp}.json`;
    const filepath = path.join(__dirname, '..', filename);
    fs.writeFileSync(filepath, JSON.stringify(allTrades, null, 2));
    console.log(`💾 Saved ${allTrades.length} trades to ${filename}`);

    return { filename, trades: allTrades, stats };
  } catch (error) {
    console.error('❌ Scraping failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  scrapeTrades()
    .then((result) => {
      console.log(`🎉 Successfully scraped ${result.trades.length} trades`);
      console.log(`📁 File saved as: ${result.filename}`);
    })
    .catch((error) => {
      console.error('💥 Scraping failed:', error);
      process.exit(1);
    });
}

module.exports = { scrapeTrades };
