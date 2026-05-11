#!/usr/bin/env node
/**
 * Bulk OpenInsider import via monthly filing-date screener (scripts/lib/openinsider_import_shared screenerUrl),
 * fetched over http:// + curl + Playwright setContent — avoids broken outbound HTTPS :443.
 *
 * Usage (from web/):
 *   node scripts/openinsider_screener_month_import.js --from 2025-1 --to 2026-5
 *   node scripts/openinsider_screener_month_import.js --dry-run --from 2026-4 --to 2026-4
 *
 * Env: DATABASE_URL, OPENINSIDER_CURL_IPV4=1, OPENINSIDER_SCREENER_SLEEP_MS (default 2500)
 */

const { chromium } = require('playwright');
const { PrismaClient } = require('@prisma/client');
const {
  extractRowsFromPage,
  persistOpenInsiderRows,
  screenerUrlMonthHttp,
} = require('./lib/openinsider_import_shared');
const { curlFetchHtml } = require('./lib/openinsider_http_fetch');

const prisma = new PrismaClient();

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseArgs() {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes('--dry-run');
  let fromYear = null;
  let fromMonth = null;
  let toYear = null;
  let toMonth = null;
  let maxPagesPerMonth = 8;
  let sleepMs = Number(process.env.OPENINSIDER_SCREENER_SLEEP_MS || '2500') || 2500;

  const fi = argv.indexOf('--from');
  if (fi >= 0 && argv[fi + 1]) {
    const [y, m] = String(argv[fi + 1]).split(/[-/]/).map(Number);
    fromYear = y;
    fromMonth = m;
  }
  const ti = argv.indexOf('--to');
  if (ti >= 0 && argv[ti + 1]) {
    const [y, m] = String(argv[ti + 1]).split(/[-/]/).map(Number);
    toYear = y;
    toMonth = m;
  }
  const mpi = argv.indexOf('--max-pages');
  if (mpi >= 0 && argv[mpi + 1]) {
    maxPagesPerMonth = Math.min(30, Math.max(1, parseInt(argv[mpi + 1], 10) || 8));
  }
  const si = argv.indexOf('--sleep-ms');
  if (si >= 0 && argv[si + 1]) {
    sleepMs = Math.min(30000, Math.max(500, parseInt(argv[si + 1], 10) || sleepMs));
  }

  if (!fromYear || !fromMonth || !toYear || !toMonth) {
    console.error(
      'Usage: node scripts/openinsider_screener_month_import.js --from YYYY-M --to YYYY-M [--max-pages 8] [--sleep-ms 2500] [--dry-run]',
    );
    process.exit(1);
  }

  const fromKey = fromYear * 12 + fromMonth;
  const toKey = toYear * 12 + toMonth;
  if (fromKey > toKey) {
    console.error('--from must be <= --to');
    process.exit(1);
  }

  return { dryRun, fromYear, fromMonth, toYear, toMonth, maxPagesPerMonth, sleepMs };
}

/** Iterator Y-M from start to end inclusive */
function* monthsInRange(fy, fm, ty, tm) {
  let y = fy;
  let m = fm;
  for (;;) {
    yield { year: y, month: m };
    if (y === ty && m === tm) return;
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
}

async function main() {
  const opts = parseArgs();
  if (process.env.OPENINSIDER_IMPORT_DISABLED === '1') {
    console.log(JSON.stringify({ skipped: true, reason: 'OPENINSIDER_IMPORT_DISABLED=1' }));
    return;
  }

  const summary = {
    dryRun: opts.dryRun,
    monthsProcessed: 0,
    pagesFetched: 0,
    rowsScraped: 0,
    imported: 0,
    skippedDup: 0,
    errors: 0,
    errorMessages: [],
  };

  const persistDelayMs = Math.min(
    5000,
    Math.max(0, Number(process.env.OPENINSIDER_PERSIST_DELAY_MS || '120') || 120),
  );
  const persistJitterMs = Math.min(
    5000,
    Math.max(0, Number(process.env.OPENINSIDER_PERSIST_JITTER_MS || '200') || 200),
  );

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

    for (const { year, month } of monthsInRange(
      opts.fromYear,
      opts.fromMonth,
      opts.toYear,
      opts.toMonth,
    )) {
      console.log(JSON.stringify({ phase: 'month', year, month }));
      summary.monthsProcessed += 1;
      let monthRows = 0;

      for (let pageNum = 1; pageNum <= opts.maxPagesPerMonth; pageNum += 1) {
        const url = screenerUrlMonthHttp(year, month, pageNum);
        let html;
        try {
          html = curlFetchHtml(url);
        } catch (e) {
          summary.errors += 1;
          summary.errorMessages.push(`curl ${year}-${month} p${pageNum}: ${e instanceof Error ? e.message : String(e)}`);
          break;
        }
        if (!html || !/<html/i.test(html)) {
          summary.errorMessages.push(`empty html ${year}-${month} p${pageNum}`);
          break;
        }
        summary.pagesFetched += 1;
        await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 120000 });
        await sleep(800);
        const trades = await extractRowsFromPage(page);
        if (!trades.length) {
          break;
        }
        monthRows += trades.length;
        summary.rowsScraped += trades.length;

        const batchSummary = {
          imported: 0,
          skippedDup: 0,
          errors: 0,
          errorMessages: [],
        };
        if (!opts.dryRun) {
          await persistOpenInsiderRows(prisma, trades, batchSummary, {
            perRowDelayMs: persistDelayMs,
            perRowJitterMs: persistJitterMs,
            stopAfterDuplicateStreak: 0,
          });
        }
        summary.imported += batchSummary.imported;
        summary.skippedDup += batchSummary.skippedDup;
        summary.errors += batchSummary.errors;
        summary.errorMessages.push(...batchSummary.errorMessages);

        if (trades.length < 4000) {
          break;
        }
        await sleep(opts.sleepMs);
      }

      console.log(JSON.stringify({ phase: 'month_done', year, month, rows: monthRows }));
      await sleep(opts.sleepMs);
    }

    console.log(JSON.stringify({ phase: 'done', ...summary }));
  } catch (e) {
    summary.errors += 1;
    summary.errorMessages.push(e instanceof Error ? e.message : String(e));
    console.error(e);
    console.log(JSON.stringify({ phase: 'fatal', ...summary }));
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close().catch(() => {});
    await prisma.$disconnect();
  }
}

main();
