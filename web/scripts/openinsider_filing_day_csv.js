#!/usr/bin/env node
/**
 * Scrape OpenInsider for a single filing date and write CSV (no DB).
 *
 *   cd web && node scripts/openinsider_filing_day_csv.js --date 2026-05-15
 *   OPENINSIDER_CURL_IPV4=1 node scripts/openinsider_filing_day_csv.js --date 2026-05-15
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const {
  extractRowsFromPage,
  rowDedupeKey,
  screenerUrl,
} = require('./lib/openinsider_import_shared');
const { curlFetchHtml } = require('./lib/openinsider_http_fetch');

const OPENINSIDER_BASES = ['https://openinsider.com', 'http://openinsider.com'];

function parseArgs() {
  const argv = process.argv.slice(2);
  let dateStr = '2026-05-15';
  let maxPages = 80;
  let sleepMs = 800;
  let outPath = '';

  const di = argv.indexOf('--date');
  if (di >= 0 && argv[di + 1]) dateStr = argv[di + 1];

  const mpi = argv.indexOf('--max-pages');
  if (mpi >= 0 && argv[mpi + 1]) maxPages = Math.min(200, Math.max(1, parseInt(argv[mpi + 1], 10) || 80));

  const si = argv.indexOf('--sleep-ms');
  if (si >= 0 && argv[si + 1]) sleepMs = Math.min(5000, Math.max(200, parseInt(argv[si + 1], 10) || 800));

  const oi = argv.indexOf('--out');
  if (oi >= 0 && argv[oi + 1]) outPath = argv[oi + 1];

  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!m) throw new Error(`Invalid --date ${dateStr} (use YYYY-MM-DD)`);

  const targetDay = `${m[1]}-${m[2]}-${m[3]}`;
  const startDate = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 0, 0, 0, 0));
  const endDate = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 23, 59, 59, 999));

  if (!outPath) {
    outPath = path.join(__dirname, '..', 'data', `openinsider_filings_${targetDay}.csv`);
  }

  return { targetDay, startDate, endDate, maxPages, sleepMs, outPath };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function filingDayKey(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function csvEscape(v) {
  const s = v == null ? '' : String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function rowsToCsv(rows) {
  const headers = [
    'filing_date',
    'trade_date',
    'ticker',
    'company_name',
    'owner_name',
    'title',
    'transaction_type',
    'price',
    'quantity',
    'owned',
    'shares_held',
    'value',
    'value_numeric',
  ];
  const lines = [headers.join(',')];
  for (const r of rows) {
    lines.push(
      [
        filingDayKey(r.transactionDate),
        filingDayKey(r.tradeDate),
        r.ticker,
        r.companyName,
        r.ownerName,
        r.title,
        r.transactionType,
        r.lastPrice ?? '',
        r.quantity,
        r.owned,
        r.sharesHeld,
        r.value,
        r.valueNumeric ?? '',
      ]
        .map(csvEscape)
        .join(','),
    );
  }
  return lines.join('\n') + '\n';
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
      console.warn(`[${label}] goto failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  for (const variant of variants) {
    try {
      const res = await fetch(variant, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml',
        },
        signal: AbortSignal.timeout(120000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();
      await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 120000 });
      return { url: variant, transport: 'fetch+setContent' };
    } catch (err) {
      lastErr = err;
    }
  }

  for (const variant of variants) {
    try {
      const httpVariant = variant.replace(/^https:\/\//i, 'http://');
      const html = curlFetchHtml(httpVariant);
      if (!html || !/<html/i.test(html)) throw new Error('empty html');
      await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 120000 });
      return { url: httpVariant, transport: 'curl+setContent' };
    } catch (err) {
      lastErr = err;
    }
  }

  throw lastErr || new Error(`[${label}] load failed`);
}

async function scrapeScreenerDay(browser, startDate, endDate, targetDay, maxPages, sleepMs, dedupe, collected) {
  const page = await browser.newPage();
  let zeroMatchStreak = 0;

  try {
    for (let p = 1; p <= maxPages; p++) {
      const url = screenerUrl(p, startDate, endDate).replace(/^https:\/\//i, 'http://');
      console.log(`[screener] page ${p}: ${url}`);
      const loaded = await loadOpenInsiderPage(page, url, `screener:p${p}`);
      console.log(`[screener] via ${loaded.transport}`);
      await sleep(sleepMs);

      const rows = await extractRowsFromPage(page);
      if (!rows.length) {
        console.log('[screener] empty table — stop');
        break;
      }

      let matched = 0;
      for (const r of rows) {
        if (filingDayKey(r.transactionDate) !== targetDay) continue;
        const k = rowDedupeKey(r);
        if (dedupe.has(k)) continue;
        dedupe.add(k);
        collected.push(r);
        matched++;
      }

      const filingDays = [...new Set(rows.map((r) => filingDayKey(r.transactionDate)))].sort();
      console.log(`[screener] rows=${rows.length} matched=${matched} filingDaysOnPage=${filingDays.slice(0, 5).join(',')}${filingDays.length > 5 ? '…' : ''}`);

      if (matched === 0) {
        zeroMatchStreak += 1;
        if (zeroMatchStreak >= 4) {
          console.log('[screener] no matches for 4 pages — stop');
          break;
        }
      } else {
        zeroMatchStreak = 0;
      }

      await sleep(sleepMs);
    }
  } finally {
    await page.close().catch(() => {});
  }
}

async function scrapeLatestLists(browser, targetDay, maxPages, sleepMs, dedupe, collected) {
  const sources = [
    (p) => (p <= 1 ? '/latest-cluster-insider-trades' : `/latest-cluster-insider-trades?page=${p}`),
    (p) => (p <= 1 ? '/latest-insider-trading' : `/latest-insider-trading?page=${p}`),
  ];

  for (const pathFn of sources) {
    const page = await browser.newPage();
    let stop = false;
    try {
      for (let p = 1; p <= Math.min(maxPages, 40) && !stop; p++) {
        const url = pathFn(p);
        console.log(`[latest] ${url}`);
        await loadOpenInsiderPage(page, url, `latest:p${p}`);
        await sleep(sleepMs);
        const rows = await extractRowsFromPage(page);
        if (!rows.length) break;

        let matched = 0;
        let oldestOnPage = targetDay;
        for (const r of rows) {
          const fd = filingDayKey(r.transactionDate);
          if (fd < oldestOnPage) oldestOnPage = fd;
          if (fd !== targetDay) continue;
          const k = rowDedupeKey(r);
          if (dedupe.has(k)) continue;
          dedupe.add(k);
          collected.push(r);
          matched++;
        }
        console.log(`[latest] rows=${rows.length} matched=${matched} oldestFiling=${oldestOnPage}`);
        if (oldestOnPage < targetDay && matched === 0) stop = true;
        if (matched === 0 && p > 5) stop = true;
        await sleep(sleepMs);
      }
    } finally {
      await page.close().catch(() => {});
    }
  }
}

async function main() {
  const { targetDay, startDate, endDate, maxPages, sleepMs, outPath } = parseArgs();
  const dedupe = new Set();
  const collected = [];

  console.log(`OpenInsider filing-day export: ${targetDay} → ${outPath}`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-dev-shm-usage', '--no-sandbox'],
  });

  try {
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1400, height: 900 },
    });
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });

    await scrapeScreenerDay(context, startDate, endDate, targetDay, maxPages, sleepMs, dedupe, collected);
    await scrapeLatestLists(context, targetDay, maxPages, sleepMs, dedupe, collected);

    collected.sort((a, b) => {
      const t = a.ticker.localeCompare(b.ticker);
      if (t !== 0) return t;
      return a.ownerName.localeCompare(b.ownerName);
    });

    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, rowsToCsv(collected), 'utf8');

    console.log(JSON.stringify({ targetDay, rowCount: collected.length, outPath }, null, 2));
  } finally {
    await browser.close().catch(() => {});
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
