#!/usr/bin/env node
/**
 * Production OpenInsider sync for CI + cron (內部交易).
 * Playwright-first, today/yesterday screener + latest-list fallback.
 *
 *   DATABASE_URL=... node scripts/openinsider_ci_sync.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { PrismaClient } = require('@prisma/client');
const {
  extractRowsFromPage,
  persistOpenInsiderRows,
  rowDedupeKey,
} = require('./lib/openinsider_import_shared');
const { scrapeScreenerFilingDay, filingDayKey } = require('./lib/openinsider_screener_scrape');

const prisma = new PrismaClient();
const ARTIFACTS = path.join(__dirname, '..', '.artifacts');

function recentUtcDays(count) {
  const days = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

async function scrapeLatestLists(context, targetDays, maxPages = 8) {
  const want = new Set(targetDays);
  const dedupe = new Set();
  const collected = [];
  const sources = [
    (p) => (p <= 1 ? '/latest-insider-trading' : `/latest-insider-trading?page=${p}`),
    (p) => (p <= 1 ? '/latest-cluster-insider-trades' : `/latest-cluster-insider-trades?page=${p}`),
  ];

  for (const pathFn of sources) {
    const page = await context.newPage();
    let stop = false;
    try {
      for (let p = 1; p <= maxPages && !stop; p++) {
        const url = `http://openinsider.com${pathFn(p)}`;
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
        await new Promise((r) => setTimeout(r, 400));
        const rows = await extractRowsFromPage(page);
        if (!rows.length) break;

        let matched = 0;
        let oldest = targetDays[targetDays.length - 1];
        for (const r of rows) {
          const fd = filingDayKey(r.transactionDate);
          if (fd < oldest) oldest = fd;
          if (!want.has(fd)) continue;
          const k = rowDedupeKey(r);
          if (dedupe.has(k)) continue;
          dedupe.add(k);
          collected.push(r);
          matched++;
        }
        console.log(`[latest] ${pathFn(p)} rows=${rows.length} matched=${matched}`);
        if (oldest < targetDays[targetDays.length - 1] && matched === 0) stop = true;
      }
    } finally {
      await page.close().catch(() => {});
    }
  }
  return collected;
}

async function main() {
  const lookbackDays = Math.min(5, Math.max(2, Number(process.env.OPENINSIDER_CI_LOOKBACK_DAYS || '2') || 2));
  const targetDays = recentUtcDays(lookbackDays);
  const summary = {
    startedAt: new Date().toISOString(),
    targetDays,
    screenerByDay: {},
    latestMatched: 0,
    imported: 0,
    skippedDup: 0,
    errors: 0,
    errorMessages: [],
    dbLatestFiling: null,
  };

  if (!process.env.DATABASE_URL) {
    console.error('::error::DATABASE_URL is not set');
    process.exit(1);
  }

  console.log(`OpenInsider CI sync → ${targetDays.join(', ')}`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-dev-shm-usage', '--no-sandbox'],
  });

  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1400, height: 900 },
  });

  const globalDedupe = new Set();
  const toPersist = [];

  try {
    for (const day of targetDays) {
      const rows = await scrapeScreenerFilingDay(context, day, {
        maxPages: 20,
        sleepMs: 350,
        dedupe: globalDedupe,
      });
      summary.screenerByDay[day] = rows.length;
      toPersist.push(...rows);
      console.log(`[screener] ${day}: ${rows.length}`);
    }

    const latestRows = await scrapeLatestLists(context, targetDays.slice(0, 2), 10);
    summary.latestMatched = latestRows.length;
    for (const r of latestRows) {
      const k = rowDedupeKey(r);
      if (globalDedupe.has(k)) continue;
      globalDedupe.add(k);
      toPersist.push(r);
    }

    if (toPersist.length) {
      await persistOpenInsiderRows(prisma, toPersist, summary, {
        perRowDelayMs: 10,
        perRowJitterMs: 5,
        stopAfterDuplicateStreak: 0,
      });
    }

    const max = await prisma.openInsiderTransaction.aggregate({ _max: { transactionDate: true } });
    summary.dbLatestFiling = max._max.transactionDate?.toISOString() ?? null;
    summary.finishedAt = new Date().toISOString();

    const maxFiling = max._max.transactionDate ? new Date(max._max.transactionDate).getTime() : 0;
    const staleHours = maxFiling ? (Date.now() - maxFiling) / (1000 * 60 * 60) : Infinity;
    summary.staleHours = Number.isFinite(staleHours) ? Number(staleHours.toFixed(2)) : null;

    fs.mkdirSync(ARTIFACTS, { recursive: true });
    fs.writeFileSync(path.join(ARTIFACTS, 'openinsider-import-report.json'), JSON.stringify(summary, null, 2), 'utf8');

    console.log(JSON.stringify(summary, null, 2));

    const maxStaleHours = Number(process.env.OPENINSIDER_CI_MAX_STALE_HOURS || '48');
    if (staleHours > maxStaleHours) {
      console.error(
        `::error::OpenInsider still stale after sync (${summary.staleHours}h > ${maxStaleHours}h). Check Playwright logs / openinsider.com reachability.`,
      );
      process.exit(1);
    }
  } catch (e) {
    summary.errors += 1;
    summary.errorMessages.push(e instanceof Error ? e.message : String(e));
    fs.mkdirSync(ARTIFACTS, { recursive: true });
    fs.writeFileSync(path.join(ARTIFACTS, 'openinsider-import-report.json'), JSON.stringify(summary, null, 2), 'utf8');
    console.error(e);
    process.exit(1);
  } finally {
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
    await prisma.$disconnect();
  }
}

main();
