'use strict';

/**
 * Paginated OpenInsider screener scrape for filing-date window(s).
 * Uses curl+setContent when HTTPS is blocked (see openinsider_http_fetch).
 */

const { chromium } = require('playwright');
const {
  extractRowsFromPage,
  rowDedupeKey,
  screenerUrl,
} = require('./openinsider_import_shared');
const { curlFetchHtml } = require('./openinsider_http_fetch');

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Filing calendar day (OpenInsider MM/DD/YYYY → stored as UTC noon). */
function filingDayKey(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function utcDayBounds(dayStr) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dayStr);
  if (!m) throw new Error(`Invalid day ${dayStr}`);
  return {
    start: new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 0, 0, 0, 0)),
    end: new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 23, 59, 59, 999)),
  };
}

function recentUtcDayStrings(count) {
  const days = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

async function loadHtmlIntoPage(page, url) {
  const httpUrl = url.replace(/^https:\/\//i, 'http://');
  const gotoMs = Number(process.env.OPENINSIDER_GOTO_TIMEOUT_MS || (process.env.CI ? '60000' : '120000'));
  // CI: curl first — Playwright goto to openinsider.com often hangs on ubuntu-latest.
  if (process.env.CI === 'true' || process.env.OPENINSIDER_CURL_FIRST === '1') {
    try {
      const html = curlFetchHtml(httpUrl);
      if (html && /<html/i.test(html)) {
        await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: gotoMs });
        return { url: httpUrl, transport: 'curl-setContent' };
      }
    } catch {
      /* fall through */
    }
  }
  try {
    await page.goto(httpUrl, { waitUntil: 'domcontentloaded', timeout: gotoMs });
    return { url: httpUrl, transport: 'playwright-goto' };
  } catch {
    /* fall through */
  }
  try {
    const html = curlFetchHtml(httpUrl);
    if (html && /<html/i.test(html)) {
      await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: gotoMs });
      return { url: httpUrl, transport: 'curl+setContent' };
    }
  } catch {
    /* fall through */
  }
  await page.goto(httpUrl, { waitUntil: 'domcontentloaded', timeout: gotoMs });
  return { url: httpUrl, transport: 'playwright-goto' };
}

/**
 * @param {import('playwright').BrowserContext} context
 * @param {string} targetDay YYYY-MM-DD
 * @param {{ maxPages?: number; sleepMs?: number; dedupe?: Set<string> }} options
 */
async function scrapeScreenerFilingDay(context, targetDay, options = {}) {
  const maxPages = options.maxPages ?? 12;
  const sleepMs = options.sleepMs ?? 500;
  const dedupe = options.dedupe ?? new Set();
  const collected = [];
  const { start, end } = utcDayBounds(targetDay);

  const page = await context.newPage();
  let zeroMatchStreak = 0;

  try {
    for (let p = 1; p <= maxPages; p++) {
      const url = screenerUrl(p, start, end).replace(/^https:\/\//i, 'http://');
      await loadHtmlIntoPage(page, url);
      await sleep(sleepMs);

      const rows = await extractRowsFromPage(page);
      if (!rows.length) break;

      let matched = 0;
      for (const r of rows) {
        if (filingDayKey(r.transactionDate) !== targetDay) continue;
        const k = rowDedupeKey(r);
        if (dedupe.has(k)) continue;
        dedupe.add(k);
        collected.push(r);
        matched++;
      }

      if (matched === 0) {
        zeroMatchStreak += 1;
        if (zeroMatchStreak >= 3) break;
      } else {
        zeroMatchStreak = 0;
      }
    }
  } finally {
    await page.close().catch(() => {});
  }

  return collected;
}

/**
 * @param {import('playwright').Browser} browser
 * @param {{ days?: number; maxPagesPerDay?: number; sleepMs?: number }} options
 */
async function scrapeRecentFilingDays(browser, options = {}) {
  const dayCount = Math.min(14, Math.max(1, Number(options.days ?? 7) || 7));
  const maxPagesPerDay = Math.min(30, Math.max(1, Number(options.maxPagesPerDay ?? 12) || 12));
  const sleepMs = Math.min(3000, Math.max(200, Number(options.sleepMs ?? 500) || 500));
  const dayStrings = recentUtcDayStrings(dayCount);
  const dedupe = new Set();
  const byDay = {};
  const all = [];

  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1400, height: 900 },
  });

  try {
    for (const day of dayStrings) {
      const rows = await scrapeScreenerFilingDay(context, day, { maxPages: maxPagesPerDay, sleepMs, dedupe });
      byDay[day] = rows.length;
      all.push(...rows);
      console.log(`[screener-day] ${day}: ${rows.length} rows`);
    }
  } finally {
    await context.close().catch(() => {});
  }

  return { rows: all, byDay, dedupeSize: dedupe.size };
}

module.exports = {
  scrapeRecentFilingDays,
  scrapeScreenerFilingDay,
  recentUtcDayStrings,
  filingDayKey,
};
