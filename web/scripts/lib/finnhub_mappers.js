'use strict';

const crypto = require('crypto');

/**
 * Map Finnhub JSON to shapes compatible with:
 * (1) admin CSV import dataset "openinsider_transactions" (see src/lib/adminCsvImport.ts)
 * (2) persistOpenInsiderRows row shape (scripts/lib/openinsider_import_shared.js)
 * (3) InstitutionalHoldingSnapshot rows (Prisma)
 *
 * Finnhub insider model: https://github.com/Finnhub-Stock-API/finnhub-go/blob/master/model_transactions.go
 */

/** YYYY-MM-DD → ISO UTC noon string */
function dayToIsoUTC(dayStr) {
  if (!dayStr) return null;
  const d = String(dayStr).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return null;
  return `${d}T12:00:00.000Z`;
}

/** Compare calendar date strings YYYY-MM-DD inclusive */
function dateStrInRange(dayStr, fromDay, toDay) {
  if (!dayStr) return false;
  const d = String(dayStr).slice(0, 10);
  return d >= fromDay && d <= toDay;
}

/** SEC Form 4 transaction codes — minimal mapping for display; extend as needed */
function transactionCodeToLabel(code) {
  if (!code) return 'Unknown';
  const c = String(code).toUpperCase();
  const map = {
    P: 'Purchase',
    S: 'Sale',
    A: 'Grant',
    G: 'Gift',
    F: 'Payment',
    M: 'Exercise',
    C: 'Conversion',
    W: 'Will',
    L: 'Small acquisition',
    J: 'Other',
  };
  return map[c] || `SEC ${c}`;
}

/**
 * @param {object} t - one Finnhub `data[]` item from /stock/insider-transactions
 * @param {object} ctx
 * @param {string} ctx.symbol
 * @param {string} ctx.companyName - from /stock/profile2 or similar
 * @returns {Record<string, string>} one CSV row for dataset openinsider_transactions
 */
function finnhubInsiderToOpenInsiderCsvRow(t, ctx) {
  const sym = (t.symbol || ctx.symbol || '').toUpperCase();
  const tradeDate = t.transactionDate || t.filingDate || '';
  const filingDate = t.filingDate || t.transactionDate || '';
  const change = t.change != null ? Number(t.change) : 0;
  const price = t.transactionPrice != null ? Number(t.transactionPrice) : null;
  const valueNum = price != null && change ? Math.abs(change) * price : null;

  return {
    id: '', // import generates oi_ hash if empty
    company_ticker: sym,
    company_name: ctx.companyName || sym,
    owner_name: t.name || 'Unknown',
    owner_title: '', // Finnhub summary endpoint does not include title
    is_institution: 'false',
    transaction_type: transactionCodeToLabel(t.transactionCode),
    trade_date: tradeDate,
    transaction_date: filingDate,
    last_price: price != null && Number.isFinite(price) ? String(price) : '',
    quantity: String(Math.abs(change) || ''),
    shares_held: t.share != null ? String(t.share) : '',
    owned: 'finnhub',
    value: valueNum != null && Number.isFinite(valueNum) ? String(Math.round(valueNum)) : '',
    value_numeric: valueNum != null && Number.isFinite(valueNum) ? String(Math.round(valueNum)) : '',
  };
}

/**
 * Row shape accepted by persistOpenInsiderRows().
 * @param {object} t - Finnhub insider transaction element
 * @param {{ symbol: string, companyName?: string }} ctx
 */
function finnhubInsiderTransactionToPersistRow(t, ctx) {
  const sym = (t.symbol || ctx.symbol || '').toUpperCase();
  const filingIso = dayToIsoUTC(t.filingDate || t.transactionDate);
  const tradeIso = dayToIsoUTC(t.transactionDate || t.filingDate);
  const change = t.change != null ? Number(t.change) : 0;
  const price = t.transactionPrice != null ? Number(t.transactionPrice) : null;
  const valueNum = price != null && Number.isFinite(price) && change
    ? Math.abs(change) * price
    : null;

  return {
    transactionDate: filingIso,
    tradeDate: tradeIso,
    ticker: sym,
    companyName: ctx.companyName || sym,
    ownerName: t.name || 'Unknown',
    title: '',
    transactionType: transactionCodeToLabel(t.transactionCode),
    lastPrice: price != null && Number.isFinite(price) ? price : null,
    quantity: String(Math.abs(change) || ''),
    sharesHeld: t.share != null ? String(t.share) : '',
    owned: 'finnhub',
    value: valueNum != null && Number.isFinite(valueNum) ? String(Math.round(valueNum)) : '',
    valueNumeric: valueNum != null && Number.isFinite(valueNum) ? valueNum : null,
  };
}

function congressTypeToTradeSide(transactionType) {
  const s = String(transactionType || '').toLowerCase();
  if (s.includes('purchase') || s === 'buy') return 'buy';
  if (s.includes('sale') || s === 'sell') return 'sell';
  return null;
}

/**
 * @returns {{ id: string, payload: object }[]} prisma-ready snapshot rows (decimals as strings)
 */
function flattenInstitutionalOwnershipForPrisma(symbolUpper, apiBody, fromDay, toDay) {
  const sym = String(apiBody.symbol || symbolUpper || '').toUpperCase();
  const groups = Array.isArray(apiBody.data) ? apiBody.data : [];
  const out = [];

  for (const g of groups) {
    const rd = g.reportDate;
    if (!dateStrInRange(rd, fromDay, toDay)) continue;

    const owns = Array.isArray(g.ownership) ? g.ownership : [];
    for (const o of owns) {
      const invName = (o.name != null ? String(o.name) : '').trim() || 'Unknown';
      const id = crypto
        .createHash('sha256')
        .update([sym, String(rd).slice(0, 10), String(o.cik || ''), invName].join('|'))
        .digest('hex')
        .slice(0, 28);

      out.push({
        id,
        symbol: sym,
        reportDate: new Date(`${String(rd).slice(0, 10)}T12:00:00.000Z`),
        investorCik: o.cik != null ? String(o.cik) : null,
        investorName: invName,
        putCall: o.putCall != null ? String(o.putCall) : null,
        changeShares: o.change != null ? String(o.change) : null,
        sharesHeld: o.share != null ? String(o.share) : null,
        valueUsd: o.value != null ? String(o.value) : null,
        pctPortfolio: o.percentage != null ? String(o.percentage) : null,
        dataSource: 'finnhub',
      });
    }
  }

  return out;
}

/**
 * One flattened row per (reportDate × investor) for 13F-style data (CSV export).
 */
function finnhubInstitutionalToCsvRow(symbol, cusip, reportDate, o) {
  return {
    symbol: (symbol || '').toUpperCase(),
    cusip: cusip || '',
    report_date: reportDate || '',
    investor_cik: o.cik != null ? String(o.cik) : '',
    investor_name: o.name != null ? String(o.name) : '',
    put_call: o.putCall != null ? String(o.putCall) : '',
    change: o.change != null ? String(o.change) : '',
    share: o.share != null ? String(o.share) : '',
    value: o.value != null ? String(o.value) : '',
    percentage: o.percentage != null ? String(o.percentage) : '',
    data_source: 'finnhub',
  };
}

function csvEscape(v) {
  const s = v == null ? '' : String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function rowToCsvLine(obj, headers) {
  return headers.map((h) => csvEscape(obj[h] ?? '')).join(',');
}

module.exports = {
  transactionCodeToLabel,
  dayToIsoUTC,
  dateStrInRange,
  finnhubInsiderToOpenInsiderCsvRow,
  finnhubInsiderTransactionToPersistRow,
  congressTypeToTradeSide,
  flattenInstitutionalOwnershipForPrisma,
  finnhubInstitutionalToCsvRow,
  csvEscape,
  rowToCsvLine,
  OPENINSIDER_TX_CSV_HEADERS: [
    'id',
    'company_ticker',
    'company_name',
    'owner_name',
    'owner_title',
    'is_institution',
    'transaction_type',
    'trade_date',
    'transaction_date',
    'last_price',
    'quantity',
    'shares_held',
    'owned',
    'value',
    'value_numeric',
  ],
  INSTITUTIONAL_CSV_HEADERS: [
    'symbol',
    'cusip',
    'report_date',
    'investor_cik',
    'investor_name',
    'put_call',
    'change',
    'share',
    'value',
    'percentage',
    'data_source',
  ],
};
