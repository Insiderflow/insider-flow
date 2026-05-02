#!/usr/bin/env node
/**
 * Headless OpenInsider scrape → Prisma OpenInsider* tables (powers /insider web page).
 * See scripts/lib/openinsider_import_shared.js for parsing/upsert logic.
 */

const { chromium } = require('playwright');
const { PrismaClient } = require('@prisma/client');
const {
  extractRowsFromPage,
  persistOpenInsiderRows,
} = require('./lib/openinsider_import_shared');

const prisma = new PrismaClient();

const OPENINSIDER_URL = 'https://openinsider.com/latest-cluster-insider-trades';

function parseArgs() {
  return { dryRun: process.argv.includes('--dry-run') };
}

async function main() {
  try {
    const { dryRun } = parseArgs();

    if (process.env.OPENINSIDER_IMPORT_DISABLED === '1') {
      console.log(JSON.stringify({ skipped: true, reason: 'OPENINSIDER_IMPORT_DISABLED=1' }));
      return;
    }

    const maxRows = Math.min(
      500,
      Math.max(1, Number(process.env.OPENINSIDER_MAX_ROWS || '150') || 150),
    );

    const summary = {
      url: OPENINSIDER_URL,
      dryRun,
      scraped: 0,
      imported: 0,
      skippedDup: 0,
      errors: 0,
      errorMessages: [],
    };

    console.log(`OpenInsider import starting (maxRows=${maxRows}, dryRun=${dryRun})`);

    let browser;
    try {
      browser = await chromium.launch({
        headless: true,
        args: ['--disable-dev-shm-usage', '--no-sandbox'],
      });
      const context = await browser.newContext({
        userAgent:
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1400, height: 900 },
        locale: 'en-US',
      });
      await context.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      });

      const page = await context.newPage();
      await page.goto(OPENINSIDER_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
      await page.waitForTimeout(2500);

      const html = await page.content();
      if (/captcha|blocked|challenge|Cloudflare/i.test(html)) {
        console.warn('OpenInsider page may be blocked; continuing with whatever table exists.');
      }

      let trades = await extractRowsFromPage(page);
      summary.scraped = trades.length;
      trades = trades.slice(0, maxRows);

      if (trades.length === 0) {
        console.warn('OpenInsider: no rows extracted (layout change or blocking).');
        console.log(JSON.stringify(summary));
        return;
      }

      if (dryRun) {
        console.log(`Dry run: would import ${trades.length} rows (showing first 3 tickers)`);
        console.log(trades.slice(0, 3).map((t) => t.ticker).join(', '));
        console.log(JSON.stringify(summary));
        return;
      }

      await persistOpenInsiderRows(prisma, trades, summary);
      console.log(JSON.stringify(summary));
    } catch (e) {
      summary.errors += 1;
      summary.errorMessages.push(e instanceof Error ? e.message : String(e));
      console.error('OpenInsider import fatal:', e);
      console.log(JSON.stringify(summary));
      process.exitCode = 1;
    } finally {
      if (browser) await browser.close().catch(() => {});
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
