#!/usr/bin/env node
/**
 * Headless OpenInsider scrape → Prisma OpenInsider* tables (powers /insider web page).
 * See scripts/lib/openinsider_import_shared.js for parsing/upsert logic.
 *
 * Load order (handles networks where outbound HTTPS :443 is blocked/refused but HTTP :80 works):
 *   1) curl per URL (HTTP first)
 *   2) fetch()
 *   3) Playwright goto
 *
 * OPENINSIDER_CURL_IPV4=1 — append curl --ipv4 (helps when IPv6 has no route).
 */

const { chromium } = require('playwright');
const { PrismaClient } = require('@prisma/client');
const {
  extractRowsFromPage,
  persistOpenInsiderRows,
} = require('./lib/openinsider_import_shared');
const { curlFetchHtml } = require('./lib/openinsider_http_fetch');

const prisma = new PrismaClient();

/** HTTP first: avoids Playwright noise when only port 80 works. */
const OPENINSIDER_URLS = [
  'http://openinsider.com/latest-cluster-insider-trades',
  'https://openinsider.com/latest-cluster-insider-trades',
];

function parseArgs() {
  return { dryRun: process.argv.includes('--dry-run') };
}

/**
 * @param {import('playwright').Page} page
 * @param {{ url: string | null; transport: string | null }} summary
 */
async function loadOpenInsiderDom(page, summary) {
  let lastErr = null;

  for (const url of OPENINSIDER_URLS) {
    try {
      const html = curlFetchHtml(url);
      if (!html || !/<html/i.test(html)) throw new Error('curl returned empty/non-html payload');
      await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 120000 });
      summary.url = url;
      summary.transport = 'curl+setContent';
      console.log(`OpenInsider loaded via curl → setContent (${url})`);
      return;
    } catch (err) {
      lastErr = err;
      console.warn(`OpenInsider curl failed for ${url}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  for (const url of OPENINSIDER_URLS) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(120000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();
      await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 120000 });
      summary.url = url;
      summary.transport = 'node-fetch+setContent';
      console.log(`OpenInsider loaded via fetch → setContent (${url})`);
      return;
    } catch (err) {
      lastErr = err;
      console.warn(`OpenInsider fetch failed for ${url}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  for (const url of OPENINSIDER_URLS) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
      summary.url = url;
      summary.transport = 'playwright-goto';
      console.log(`OpenInsider loaded via Playwright (${url})`);
      return;
    } catch (err) {
      lastErr = err;
      const message = err instanceof Error ? err.message : String(err);
      const isNetworkRefusal =
        /ERR_CONNECTION_REFUSED|ERR_CONNECTION_RESET|ERR_CONNECTION_TIMED_OUT|ERR_NAME_NOT_RESOLVED|chrome-error:\/\/chromewebdata|interrupted by another navigation/i.test(
          message,
        );
      console.warn(`OpenInsider goto failed for ${url}: ${message}`);
      if (!isNetworkRefusal) throw err;
    }
  }

  throw lastErr || new Error('OpenInsider navigation+fetch failed for all URL variants');
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
    const persistDelayMs = Math.min(
      5000,
      Math.max(0, Number(process.env.OPENINSIDER_PERSIST_DELAY_MS || '250') || 250),
    );
    const persistJitterMs = Math.min(
      5000,
      Math.max(0, Number(process.env.OPENINSIDER_PERSIST_JITTER_MS || '350') || 350),
    );
    const duplicateStreakStop = Math.min(
      500,
      Math.max(0, Number(process.env.OPENINSIDER_DUPLICATE_STREAK_STOP || '40') || 40),
    );

    const summary = {
      url: null,
      transport: null,
      dryRun,
      scraped: 0,
      imported: 0,
      skippedDup: 0,
      errors: 0,
      errorMessages: [],
      rateLimit: {
        persistDelayMs,
        persistJitterMs,
        duplicateStreakStop,
      },
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
      await loadOpenInsiderDom(page, summary);
      await page.waitForTimeout(2500);

      const html = await page.content();
      // Avoid broad matches like "blocked" / "challenge" (common in normal HTML); target bot walls only.
      const looksLikeBotWall =
        /(?:__cf_bm|cf-ray|cdn-cgi\/challenge|Checking your browser before accessing|Just a moment)/i.test(html) ||
        /g-recaptcha|hcaptcha|data-sitekey/i.test(html);
      if (looksLikeBotWall) {
        console.warn('OpenInsider response looks like a bot-check page; continuing if a table is present.');
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

      await persistOpenInsiderRows(prisma, trades, summary, {
        perRowDelayMs: persistDelayMs,
        perRowJitterMs: persistJitterMs,
        stopAfterDuplicateStreak: duplicateStreakStop,
      });
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
