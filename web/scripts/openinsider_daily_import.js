#!/usr/bin/env node
/**
 * Headless OpenInsider scrape → Prisma OpenInsider* tables (powers /insider web page).
 *
 * Safety:
 * - Disabled when OPENINSIDER_IMPORT_DISABLED=1
 * - Exits 0 when scrape yields no rows (site layout/captcha) so CI politician pipeline is unaffected
 * - Dedupes via existing transaction uniqueness pattern (companyId, ownerId, transactionDate, transactionType)
 *
 * Usage:
 *   cd web && node scripts/openinsider_daily_import.js [--dry-run]
 *
 * Env:
 *   OPENINSIDER_IMPORT_DISABLED=1  — skip immediately exit 0
 *   OPENINSIDER_MAX_ROWS=150       — cap rows processed per run (default 150)
 */

const { chromium } = require('playwright');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const OPENINSIDER_URL = 'https://openinsider.com/latest-cluster-insider-trades';

function parseArgs() {
  return { dryRun: process.argv.includes('--dry-run') };
}

function parseUSD(str) {
  if (!str) return null;
  const cleaned = String(str).replace(/[$,\s+]/g, '').replace(/^\+/, '');
  const sign = String(str).trim().startsWith('-') ? -1 : 1;
  const n = Number(cleaned.replace(/-/g, ''));
  return Number.isFinite(n) ? sign * Math.abs(n) : null;
}

function parseQty(str) {
  if (!str) return '';
  return String(str).replace(/[,\s]/g, '');
}

function zTradeDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? null : d;
}

function guessInstitution(ownerName, title) {
  const o = String(ownerName || '');
  const t = String(title || '');
  return (
    /\b(LLC|L\.P\.|LP|Trust|Partners|Capital Management|Asset Management|Investments|Holdings)\b/i.test(o) ||
    /\d+%/.test(t)
  );
}

async function upsertCompany(ticker, name) {
  const t = String(ticker || '').trim().toUpperCase();
  const n = String(name || t).trim();
  if (!t) throw new Error('missing ticker');
  return prisma.openInsiderCompany.upsert({
    where: { ticker: t },
    create: { ticker: t, name: n },
    update: { name: n },
  });
}

async function upsertOwner(name, title, isInstitution) {
  const n = String(name || '').trim();
  if (!n) throw new Error('missing owner');
  const existing = await prisma.openInsiderOwner.findUnique({ where: { name: n } });
  if (existing) {
    return prisma.openInsiderOwner.update({
      where: { name: n },
      data: {
        title: title ?? existing.title,
        isInstitution: isInstitution ?? existing.isInstitution,
      },
    });
  }
  return prisma.openInsiderOwner.create({
    data: { name: n, title: title || null, isInstitution: Boolean(isInstitution) },
  });
}

async function upsertTransaction(payload) {
  const { companyId, ownerId, transactionDate, transactionType } = payload;
  const existing = await prisma.openInsiderTransaction.findFirst({
    where: { companyId, ownerId, transactionDate, transactionType },
  });
  if (existing) return { row: existing, created: false };
  const row = await prisma.openInsiderTransaction.create({ data: payload });
  return { row, created: true };
}

async function extractRows(page) {
  const selectors = ['table.tinytable tbody tr', 'table tbody tr', 'table.tinytable tr', '.tinytable tbody tr'];
  let tableSelector = null;
  for (const selector of selectors) {
    try {
      await page.waitForSelector(selector, { timeout: 15000 });
      tableSelector = selector;
      break;
    } catch {
      /* try next */
    }
  }
  if (!tableSelector) return [];

  return page.evaluate((selector) => {
    const rows = document.querySelectorAll(selector);
    const results = [];

    rows.forEach((row) => {
      const cols = row.querySelectorAll('td');
      if (cols.length < 13) return;

      const filingDateText =
        cols[1].querySelector('a')?.textContent?.trim() || cols[1].textContent?.trim() || '';
      const tradeDateText = cols[2].textContent?.trim() || '';
      const ticker =
        cols[3].querySelector('a')?.textContent?.trim() || cols[3].textContent?.trim() || '';
      const companyName =
        cols[4].querySelector('a')?.textContent?.trim() || cols[4].textContent?.trim() || '';
      const ownerName =
        cols[5].querySelector('a')?.textContent?.trim() || cols[5].textContent?.trim() || '';
      const titleText = cols[6].textContent?.trim() || '';
      const transactionType = cols[7].textContent?.trim() || '';
      const priceText = cols[8].textContent?.trim() || '';
      const quantity = cols[9].textContent?.trim() || '';
      const owned = cols[10].textContent?.trim() || '';
      const sharesHeld = cols[11].textContent?.trim() || '';
      const valueText = cols[12].textContent?.trim() || '';

      const parseDate = (dateStr) => {
        if (!dateStr) return null;
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          return new Date(parseInt(parts[2], 10), parseInt(parts[0], 10) - 1, parseInt(parts[1], 10));
        }
        return null;
      };

      const parsePrice = (priceStr) => {
        if (!priceStr) return null;
        const v = parseFloat(priceStr.replace(/[$,]/g, ''));
        return Number.isFinite(v) ? v : null;
      };

      const parseValue = (valueStr) => {
        if (!valueStr) return null;
        const cleaned = valueStr.replace(/[$,]/g, '');
        const multiplier = cleaned.includes('-') ? -1 : 1;
        const n = parseFloat(cleaned.replace(/[+-]/g, ''));
        return Number.isFinite(n) ? multiplier * Math.abs(n) : null;
      };

      const transactionDate = parseDate(filingDateText);
      const tradeDateParsed = parseDate(tradeDateText) || transactionDate;
      const lastPrice = parsePrice(priceText);
      const valueNumeric = parseValue(valueText);

      if (!ticker || !companyName || !ownerName || !transactionDate || !tradeDateParsed) return;

      results.push({
        transactionDate: transactionDate.toISOString(),
        tradeDate: tradeDateParsed.toISOString(),
        ticker,
        companyName,
        ownerName,
        title: titleText,
        transactionType,
        lastPrice,
        quantity,
        sharesHeld,
        owned,
        value: valueText,
        valueNumeric,
      });
    });

    return results;
  }, tableSelector);
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

      let trades = await extractRows(page);
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

      for (const t of trades) {
        try {
          const company = await upsertCompany(t.ticker, t.companyName);
          const institution = guessInstitution(t.ownerName, t.title);
          const owner = await upsertOwner(t.ownerName, t.title, institution);

          const transactionDate = new Date(t.transactionDate);
          const tradeDate = zTradeDate(t.tradeDate);
          if (!tradeDate) {
            summary.errors += 1;
            summary.errorMessages.push(`bad tradeDate ${t.ticker}`);
            continue;
          }

          const payload = {
            transactionDate,
            tradeDate,
            transactionType: t.transactionType || 'Unknown',
            lastPrice: t.lastPrice != null ? t.lastPrice : null,
            quantity: parseQty(t.quantity) || String(t.quantity || ''),
            sharesHeld: parseQty(t.sharesHeld) || String(t.sharesHeld || ''),
            owned: t.owned || '',
            value: t.value || '',
            valueNumeric: t.valueNumeric != null ? t.valueNumeric : null,
            companyId: company.id,
            ownerId: owner.id,
          };

          const { created } = await upsertTransaction(payload);
          if (created) summary.imported += 1;
          else summary.skippedDup += 1;
        } catch (e) {
          summary.errors += 1;
          summary.errorMessages.push(`${t.ticker}: ${e instanceof Error ? e.message : String(e)}`);
        }
      }

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
