#!/usr/bin/env node
/**
 * Backfill OpenInsider corporate insider trades for a filing-date window (~last N days).
 * Uses: (1) paginated "latest cluster" + "latest insider" lists, (2) OpenInsider screener filing-date range with pagination.
 *
 * Production:
 *   cd web && DATABASE_URL="postgresql://..." node scripts/openinsider_backfill_import.js --days 62
 *
 * Options:
 *   --days 62           filing/trade rows with filing date >= today-days (default 62 ~ 2 months)
 *   --dry-run           scrape only, no Prisma writes
 *   --max-pages 120     max pages per URL pattern (default 120)
 *   --sleep-ms 900      delay between navigations (default 900)
 */

const { chromium } = require('playwright');
const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const {
  extractRowsFromPage,
  persistOpenInsiderRows,
  rowDedupeKey,
  screenerUrl,
} = require('./lib/openinsider_import_shared');

const prisma = new PrismaClient();
const OPENINSIDER_BASES = ['https://openinsider.com', 'http://openinsider.com'];

function parseArgs() {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes('--dry-run');
  const monthByMonth = argv.includes('--month-by-month');
  let days = 62;
  let maxPages = 120;
  let sleepMs = 900;

  const di = argv.indexOf('--days');
  if (di >= 0 && argv[di + 1]) days = Math.min(3650, Math.max(1, parseInt(argv[di + 1], 10) || 62));

  const mpi = argv.indexOf('--max-pages');
  if (mpi >= 0 && argv[mpi + 1]) maxPages = Math.min(300, Math.max(1, parseInt(argv[mpi + 1], 10) || 120));

  const si = argv.indexOf('--sleep-ms');
  if (si >= 0 && argv[si + 1]) sleepMs = Math.min(5000, Math.max(200, parseInt(argv[si + 1], 10) || 900));

  return { dryRun, monthByMonth, days, maxPages, sleepMs };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function clusterPageUrl(pageNum) {
  if (pageNum <= 1) return 'https://openinsider.com/latest-cluster-insider-trades';
  return `https://openinsider.com/latest-cluster-insider-trades?page=${pageNum}`;
}

function latestInsiderPageUrl(pageNum) {
  if (pageNum <= 1) return 'https://openinsider.com/latest-insider-trading';
  return `https://openinsider.com/latest-insider-trading?page=${pageNum}`;
}

function toUrlVariants(url) {
  const raw = String(url).trim();
  if (/^https?:\/\//i.test(raw)) {
    const noProto = raw.replace(/^https?:\/\//i, '');
    return [`https://${noProto}`, `http://${noProto}`];
  }
  const noLeading = raw.replace(/^\/+/, '');
  return OPENINSIDER_BASES.map((base) => `${base}/${noLeading}`);
}

async function loadOpenInsiderPage(page, url, label) {
  const variants = toUrlVariants(url);
  let lastErr = null;

  for (const variant of variants) {
    try {
      await page.goto(variant, { waitUntil: 'domcontentloaded', timeout: 120000 });
      return { url: variant, transport: 'playwright-goto' };
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      const isNetworkRefusal =
        /ERR_CONNECTION_REFUSED|ERR_CONNECTION_RESET|ERR_CONNECTION_TIMED_OUT|ERR_NAME_NOT_RESOLVED|chrome-error:\/\/chromewebdata|interrupted by another navigation/i.test(
          msg,
        );
      console.warn(`[${label}] goto failed for ${variant}: ${msg}`);
      if (!isNetworkRefusal) throw err;
    }
  }

  for (const variant of variants) {
    try {
      const res = await fetch(variant, {
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
      return { url: variant, transport: 'fetch+setContent' };
    } catch (err) {
      lastErr = err;
      console.warn(`[${label}] fetch failed for ${variant}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  for (const variant of variants) {
    try {
      const html = execSync(`curl -L --max-time 120 -sS "${variant}"`, {
        cwd: process.cwd(),
        stdio: ['ignore', 'pipe', 'pipe'],
      }).toString();
      if (!html || !/<html/i.test(html)) throw new Error('curl returned empty/non-html payload');
      await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 120000 });
      return { url: variant, transport: 'curl+setContent' };
    } catch (err) {
      lastErr = err;
      console.warn(`[${label}] curl failed for ${variant}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  throw lastErr || new Error(`[${label}] all transports failed for ${url}`);
}

async function scrapePagedList(browser, label, urlFn, cutoffMs, globalDedupe, maxPages, sleepMs, collected) {
  const context = browser.contexts()[0];
  const page = await context.newPage();
  let staleStreak = 0;
  let zeroNewStreak = 0;

  try {
    for (let p = 1; p <= maxPages; p++) {
      const url = urlFn(p);
      console.log(`[${label}] page ${p}: ${url}`);
      const loaded = await loadOpenInsiderPage(page, url, `${label}:p${p}`);
      console.log(`[${label}] loaded via ${loaded.transport} (${loaded.url})`);
      await sleep(sleepMs);
      const html = await page.content().catch(() => '');
      if (/captcha|blocked|challenge|Cloudflare/i.test(html)) {
        console.warn(`[${label}] possible block/captcha on page ${p}`);
      }

      const rows = await extractRowsFromPage(page);
      if (!rows.length) {
        console.log(`[${label}] empty table, stopping pagination`);
        break;
      }

      let newestTs = 0;
      let oldestTs = Infinity;
      let kept = 0;
      for (const r of rows) {
        const ts = new Date(r.transactionDate).getTime();
        if (Number.isFinite(ts)) {
          newestTs = Math.max(newestTs, ts);
          oldestTs = Math.min(oldestTs, ts);
        }
        if (ts >= cutoffMs) {
          const k = rowDedupeKey(r);
          if (!globalDedupe.has(k)) {
            globalDedupe.add(k);
            collected.push(r);
            kept++;
          }
        }
      }

      console.log(
        `[${label}] rows=${rows.length} keptInWindow=${kept} oldestFiling=${Number.isFinite(oldestTs) ? new Date(oldestTs).toISOString().slice(0, 10) : 'n/a'}`,
      );
      if (kept === 0) {
        zeroNewStreak += 1;
        if (zeroNewStreak >= 3) {
          console.log(`[${label}] stopping after ${zeroNewStreak} pages with no new deduped rows`);
          break;
        }
      } else {
        zeroNewStreak = 0;
      }

      const allOlderThanCutoff = rows.every((r) => new Date(r.transactionDate).getTime() < cutoffMs);
      if (allOlderThanCutoff) {
        staleStreak += 1;
        if (staleStreak >= 8) {
          console.log(`[${label}] stopping after ${staleStreak} stale pages`);
          break;
        }
      } else {
        staleStreak = 0;
      }

      if (Number.isFinite(newestTs) && newestTs < cutoffMs && staleStreak >= 3) break;

      await sleep(sleepMs);
    }
  } finally {
    await page.close().catch(() => {});
  }
}

async function scrapeScreenerWindow(browser, startDate, endDate, cutoffMs, globalDedupe, maxPages, sleepMs, collected) {
  const context = browser.contexts()[0];
  const page = await context.newPage();
  let zeroNewStreak = 0;
  try {
    for (let p = 1; p <= maxPages; p++) {
      const url = screenerUrl(p, startDate, endDate);
      console.log(`[screener] page ${p}: ${url}`);
      const loaded = await loadOpenInsiderPage(page, url, `screener:p${p}`);
      console.log(`[screener] loaded via ${loaded.transport} (${loaded.url})`);
      await sleep(sleepMs);

      const rows = await extractRowsFromPage(page);
      if (!rows.length) {
        console.log('[screener] empty table, stopping');
        break;
      }

      let added = 0;
      for (const r of rows) {
        const ts = new Date(r.transactionDate).getTime();
        if (ts < cutoffMs) continue;
        const k = rowDedupeKey(r);
        if (globalDedupe.has(k)) continue;
        globalDedupe.add(k);
        collected.push(r);
        added++;
      }
      console.log(`[screener] rows=${rows.length} newDeduped=${added}`);
      if (added === 0) {
        zeroNewStreak += 1;
        if (zeroNewStreak >= 6) {
          console.log(`[screener] stopping after ${zeroNewStreak} pages with no new deduped rows`);
          break;
        }
      } else {
        zeroNewStreak = 0;
      }
      await sleep(sleepMs);
    }
  } finally {
    await page.close().catch(() => {});
  }
}

function startOfMonthUtc(d) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0, 0));
}

function endOfMonthUtc(d) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0, 23, 59, 59, 999));
}

function addMonthsUtc(d, delta) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + delta, 1, 0, 0, 0, 0));
}

function monthWindowsUtc(startInclusive, endInclusive) {
  const windows = [];
  let cursor = startOfMonthUtc(startInclusive);
  const endMonthStart = startOfMonthUtc(endInclusive);
  while (cursor.getTime() <= endMonthStart.getTime()) {
    const monthStart = cursor;
    const monthEnd = endOfMonthUtc(cursor);
    windows.push({
      start: new Date(Math.max(monthStart.getTime(), startInclusive.getTime())),
      end: new Date(Math.min(monthEnd.getTime(), endInclusive.getTime())),
    });
    cursor = addMonthsUtc(cursor, 1);
  }
  return windows;
}

async function main() {
  const { dryRun, monthByMonth, days, maxPages, sleepMs } = parseArgs();

  if (process.env.OPENINSIDER_IMPORT_DISABLED === '1') {
    console.log(JSON.stringify({ skipped: true, reason: 'OPENINSIDER_IMPORT_DISABLED=1' }));
    await prisma.$disconnect();
    return;
  }

  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - days);
  cutoff.setUTCHours(0, 0, 0, 0);
  const cutoffMs = cutoff.getTime();

  const windowStart = new Date(cutoffMs);
  const windowEnd = new Date();

  const summary = {
    days,
    dryRun,
    cutoff: cutoff.toISOString(),
    collectedUnique: 0,
    scrapedRawApprox: 0,
    imported: 0,
    skippedDup: 0,
    errors: 0,
    errorMessages: [],
  };

  console.log(JSON.stringify({ phase: 'start', cutoff: summary.cutoff, dryRun, days, maxPages }, null, 2));

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

    const globalDedupe = new Set();
    const collected = [];

    await scrapePagedList(browser, 'cluster', clusterPageUrl, cutoffMs, globalDedupe, maxPages, sleepMs, collected);
    await scrapePagedList(
      browser,
      'latest-insider',
      latestInsiderPageUrl,
      cutoffMs,
      globalDedupe,
      maxPages,
      sleepMs,
      collected,
    );
    if (monthByMonth) {
      const windows = monthWindowsUtc(windowStart, windowEnd);
      console.log(`[screener] month-by-month mode (${windows.length} windows)`);
      for (const [idx, w] of windows.entries()) {
        console.log(
          `[screener] window ${idx + 1}/${windows.length}: ${w.start.toISOString().slice(0, 10)} -> ${w.end
            .toISOString()
            .slice(0, 10)}`,
        );
        await scrapeScreenerWindow(
          browser,
          w.start,
          w.end,
          cutoffMs,
          globalDedupe,
          maxPages,
          sleepMs,
          collected,
        );
      }
    } else {
      await scrapeScreenerWindow(
        browser,
        windowStart,
        windowEnd,
        cutoffMs,
        globalDedupe,
        maxPages,
        sleepMs,
        collected,
      );
    }

    summary.collectedUnique = collected.length;

    if (dryRun) {
      console.log(`Dry run: ${collected.length} unique rows in filing window (sample tickers):`);
      console.log(collected.slice(0, 15).map((r) => r.ticker).join(', '));
      console.log(JSON.stringify(summary));
      return;
    }

    await persistOpenInsiderRows(prisma, collected, summary);
    console.log(JSON.stringify(summary));
  } catch (e) {
    summary.errors += 1;
    summary.errorMessages.push(e instanceof Error ? e.message : String(e));
    console.error('Backfill fatal:', e);
    console.log(JSON.stringify(summary));
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close().catch(() => {});
    await prisma.$disconnect();
  }
}

main();
