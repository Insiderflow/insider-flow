'use strict';

/**
 * Shared Playwright table extraction + Prisma upserts for OpenInsider → OpenInsider* models.
 */

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

async function upsertCompany(prisma, ticker, name) {
  const t = String(ticker || '').trim().toUpperCase();
  const n = String(name || t).trim();
  if (!t) throw new Error('missing ticker');
  return prisma.openInsiderCompany.upsert({
    where: { ticker: t },
    create: { ticker: t, name: n },
    update: { name: n },
  });
}

async function upsertOwner(prisma, name, title, isInstitution) {
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

async function upsertTransaction(prisma, payload) {
  const { companyId, ownerId, transactionDate, transactionType } = payload;
  const existing = await prisma.openInsiderTransaction.findFirst({
    where: { companyId, ownerId, transactionDate, transactionType },
  });
  if (existing) return { row: existing, created: false };
  const row = await prisma.openInsiderTransaction.create({ data: payload });
  return { row, created: true };
}

async function extractRowsFromPage(page) {
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
        const trimmed = String(dateStr).trim();
        const parsed = new Date(trimmed);
        if (!Number.isNaN(parsed.getTime())) return parsed;
        const parts = trimmed.split('/');
        if (parts.length === 3) {
          const mm = parseInt(parts[0], 10);
          const dd = parseInt(parts[1], 10);
          const yyyy = parseInt(parts[2], 10);
          const fallback = new Date(yyyy, mm - 1, dd);
          if (!Number.isNaN(fallback.getTime())) return fallback;
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

function rowDedupeKey(r) {
  return `${r.transactionDate}|${r.ticker}|${r.ownerName}|${r.transactionType}`;
}

async function persistOpenInsiderRow(prisma, t, summary) {
  const company = await upsertCompany(prisma, t.ticker, t.companyName);
  const institution = guessInstitution(t.ownerName, t.title);
  const owner = await upsertOwner(prisma, t.ownerName, t.title, institution);

  const transactionDate = new Date(t.transactionDate);
  const tradeDate = zTradeDate(t.tradeDate);
  if (!tradeDate) {
    summary.errors += 1;
    summary.errorMessages.push(`bad tradeDate ${t.ticker}`);
    return;
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

  const { created } = await upsertTransaction(prisma, payload);
  if (created) summary.imported += 1;
  else summary.skippedDup += 1;
  return created;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function persistOpenInsiderRows(prisma, rows, summary, options = {}) {
  const perRowDelayMs = Math.max(0, Number(options.perRowDelayMs || 0));
  const perRowJitterMs = Math.max(0, Number(options.perRowJitterMs || 0));
  const stopAfterDuplicateStreak = Math.max(0, Number(options.stopAfterDuplicateStreak || 0));
  let duplicateStreak = 0;

  for (const t of rows) {
    try {
      const created = await persistOpenInsiderRow(prisma, t, summary);
      duplicateStreak = created ? 0 : duplicateStreak + 1;
      if (stopAfterDuplicateStreak > 0 && duplicateStreak >= stopAfterDuplicateStreak) {
        if (summary && Array.isArray(summary.errorMessages)) {
          summary.errorMessages.push(
            `early-stop: duplicate streak reached ${duplicateStreak} (threshold=${stopAfterDuplicateStreak})`,
          );
        }
        break;
      }
    } catch (e) {
      summary.errors += 1;
      summary.errorMessages.push(`${t.ticker}: ${e instanceof Error ? e.message : String(e)}`);
    }
    if (perRowDelayMs > 0 || perRowJitterMs > 0) {
      const jitter = perRowJitterMs > 0 ? Math.floor(Math.random() * (perRowJitterMs + 1)) : 0;
      await sleep(perRowDelayMs + jitter);
    }
  }
}

function formatOpenInsiderDate(d) {
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const yyyy = d.getUTCFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

/** Filing-date window screener (same 13-column tinytable when OpenInsider serves HTML). */
function screenerUrl(pageNum, startDate, endDate) {
  const fdr = formatOpenInsiderDate(startDate);
  const fdlt = formatOpenInsiderDate(endDate);
  let u =
    `https://openinsider.com/screener?s=&o=&pl=&ph=&vl=&vh=&fel=&fdd=&fdiff=&tm=4&fdr=${encodeURIComponent(fdr)}&fdlt=${encodeURIComponent(fdlt)}&sx=&groups=eaglesol.html`;
  if (pageNum > 1) u += `&page=${pageNum}`;
  return u;
}

module.exports = {
  extractRowsFromPage,
  persistOpenInsiderRow,
  persistOpenInsiderRows,
  guessInstitution,
  parseQty,
  zTradeDate,
  rowDedupeKey,
  formatOpenInsiderDate,
  screenerUrl,
};
