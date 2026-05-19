#!/usr/bin/env node
/**
 * Import only trades/disclosures for a single published/filing day (no historical pagination).
 *
 *   DOTENV_CONFIG_PATH=.env.local node -r dotenv/config scripts/sync_published_day.js --date 2026-05-19
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { chromium } = require('playwright');
const { PrismaClient } = require('@prisma/client');
const { persistOpenInsiderRows } = require('./lib/openinsider_import_shared');
const { scrapeScreenerFilingDay } = require('./lib/openinsider_screener_scrape');

const prisma = new PrismaClient();
const ROOT = path.join(__dirname, '..');

function parseArgs() {
  const argv = process.argv.slice(2);
  let targetDay = new Date().toISOString().slice(0, 10);
  const di = argv.indexOf('--date');
  if (di >= 0 && argv[di + 1]) targetDay = argv[di + 1];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDay)) throw new Error('Use --date YYYY-MM-DD');
  const skipOi = argv.includes('--capitol-only');
  const skipCap = argv.includes('--openinsider-only');
  return { targetDay, skipOi, skipCap };
}

function publishedDay(iso) {
  if (!iso) return '';
  return new Date(iso).toISOString().slice(0, 10);
}

async function syncCapitol(targetDay) {
  // Today's disclosures are on page 1–2; avoid 45-page historical crawl.
  process.env.SCRAPE_MAX_PAGES = '3';
  process.env.SCRAPE_PAGE_DELAY_MS = '400';
  const { scrapeTrades } = require('./scrape_trades_fixed');
  const { trades } = await scrapeTrades();
  const today = trades.filter((t) => publishedDay(t.publishedAt) === targetDay);
  console.log(`[capitol] scraped ${trades.length} rows → ${today.length} published on ${targetDay}`);

  if (!today.length) {
    return { imported: 0, updated: 0, skipped: 0, file: null };
  }

  const tmp = path.join(ROOT, `.sync_capitol_${targetDay}.json`);
  fs.writeFileSync(tmp, JSON.stringify(today, null, 2));
  execSync(`node scripts/import_scraped_trades.js "${tmp}"`, {
    cwd: ROOT,
    stdio: 'inherit',
    env: process.env,
  });
  try {
    fs.unlinkSync(tmp);
  } catch {
    /* ok */
  }

  const artifact = path.join(ROOT, '.artifacts', 'last-capital-import.json');
  return JSON.parse(fs.readFileSync(artifact, 'utf8'));
}

async function syncOpenInsider(targetDay) {
  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-dev-shm-usage', '--no-sandbox'],
  });
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1400, height: 900 },
  });

  const summary = { imported: 0, skippedDup: 0, errors: 0, errorMessages: [] };
  try {
    const rows = await scrapeScreenerFilingDay(context, targetDay, {
      maxPages: 20,
      sleepMs: 400,
      dedupe: new Set(),
    });
    console.log(`[openinsider] scraped ${rows.length} filings on ${targetDay}`);
    if (rows.length) {
      await persistOpenInsiderRows(prisma, rows, summary, {
        perRowDelayMs: 60,
        perRowJitterMs: 30,
        stopAfterDuplicateStreak: 0,
      });
    }
    return { scraped: rows.length, ...summary };
  } finally {
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

async function main() {
  const { targetDay, skipOi, skipCap } = parseArgs();
  console.log(`\n🔄 Live sync for ${targetDay} → production DB\n`);

  const result = { targetDay, capitol: null, openinsider: null };

  if (!skipCap) {
    result.capitol = await syncCapitol(targetDay);
  }
  if (!skipOi) {
    result.openinsider = await syncOpenInsider(targetDay);
  }

  const cap = await prisma.trade.count({
    where: { published_at: { gte: new Date(`${targetDay}T00:00:00.000Z`), lt: new Date(`${targetDay}T23:59:59.999Z`) } },
  });
  const oiMax = await prisma.openInsiderTransaction.aggregate({ _max: { transactionDate: true } });
  const tradeMax = await prisma.trade.aggregate({ _max: { published_at: true } });

  result.db = {
    capitol_published_on_day: cap,
    max_capitol_published_at: tradeMax._max.published_at?.toISOString() ?? null,
    max_openinsider_filing: oiMax._max.transactionDate?.toISOString() ?? null,
  };

  const importedDelta =
    (Number(result.capitol?.imported) || 0) + (Number(result.openinsider?.imported) || 0);
  const artifactsDir = path.join(ROOT, '.artifacts');
  fs.mkdirSync(artifactsDir, { recursive: true });
  fs.writeFileSync(
    path.join(artifactsDir, 'daily-scrape-report.json'),
    JSON.stringify(
      {
        status: 'success',
        source: 'sync_published_day',
        finishedAt: new Date().toISOString(),
        targetDay,
        database: {
          importedDelta,
          latestTradeDate: tradeMax._max.published_at?.toISOString() ?? null,
        },
      },
      null,
      2,
    ),
    'utf8',
  );

  console.log('\n' + JSON.stringify(result, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
