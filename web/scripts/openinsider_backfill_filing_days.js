#!/usr/bin/env node
/**
 * Scrape + import OpenInsider filings for each calendar day in a range (UTC filing date).
 *
 *   cd web && OPENINSIDER_CURL_IPV4=1 node scripts/openinsider_backfill_filing_days.js --from 2026-05-12 --to 2026-05-16
 *   node scripts/openinsider_backfill_filing_days.js --days 7   # last 7 UTC days incl. today
 */

const { chromium } = require('playwright');
const { PrismaClient } = require('@prisma/client');
const { persistOpenInsiderRows } = require('./lib/openinsider_import_shared');
const { scrapeScreenerFilingDay } = require('./lib/openinsider_screener_scrape');

const prisma = new PrismaClient();

function parseArgs() {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes('--dry-run');
  let from = null;
  let to = null;
  let days = null;
  let maxPages = 15;
  let sleepMs = 450;

  const fi = argv.indexOf('--from');
  if (fi >= 0 && argv[fi + 1]) from = argv[fi + 1];
  const ti = argv.indexOf('--to');
  if (ti >= 0 && argv[ti + 1]) to = argv[ti + 1];
  const di = argv.indexOf('--days');
  if (di >= 0 && argv[di + 1]) days = parseInt(argv[di + 1], 10);
  const mpi = argv.indexOf('--max-pages');
  if (mpi >= 0 && argv[mpi + 1]) maxPages = parseInt(argv[mpi + 1], 10);
  const si = argv.indexOf('--sleep-ms');
  if (si >= 0 && argv[si + 1]) sleepMs = parseInt(argv[si + 1], 10);

  const dayList = [];
  if (days && days > 0) {
    const now = new Date();
    for (let i = 0; i < days; i++) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
      dayList.push(d.toISOString().slice(0, 10));
    }
    dayList.reverse();
  } else if (from && to) {
    const start = new Date(`${from}T00:00:00.000Z`);
    const end = new Date(`${to}T00:00:00.000Z`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new Error('Invalid --from / --to (YYYY-MM-DD)');
    }
    for (let t = start.getTime(); t <= end.getTime(); t += 86400000) {
      dayList.push(new Date(t).toISOString().slice(0, 10));
    }
  } else {
    throw new Error('Use --from YYYY-MM-DD --to YYYY-MM-DD or --days N');
  }

  return { dryRun, dayList, maxPages, sleepMs };
}

async function main() {
  const { dryRun, dayList, maxPages, sleepMs } = parseArgs();
  console.log(`Backfill filing days: ${dayList.join(', ')} (dryRun=${dryRun})`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-dev-shm-usage', '--no-sandbox'],
  });

  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1400, height: 900 },
  });

  const dedupe = new Set();
  const summary = { imported: 0, skippedDup: 0, errors: 0, errorMessages: [], byDay: {} };

  try {
    for (const day of dayList) {
      const rows = await scrapeScreenerFilingDay(context, day, { maxPages, sleepMs, dedupe });
      summary.byDay[day] = { scraped: rows.length };
      console.log(`[${day}] scraped ${rows.length} unique rows`);

      if (!dryRun && rows.length > 0) {
        const before = summary.imported;
        await persistOpenInsiderRows(prisma, rows, summary, {
          perRowDelayMs: 80,
          perRowJitterMs: 40,
          stopAfterDuplicateStreak: 0,
        });
        summary.byDay[day].imported = summary.imported - before;
        summary.byDay[day].skippedDup = rows.length - summary.byDay[day].imported;
      }
    }
  } finally {
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
  }

  const max = await prisma.openInsiderTransaction.aggregate({ _max: { transactionDate: true } });
  summary.dbLatestFiling = max._max.transactionDate?.toISOString() || null;
  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
