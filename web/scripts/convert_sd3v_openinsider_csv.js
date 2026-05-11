#!/usr/bin/env node
/**
 * Convert sd3v/openinsiderData CSV (or same column layout) → admin CSV dataset `openinsider_transactions`
 * (see src/lib/adminCsvImport.ts). Pipe into Admin import API or a small Prisma script.
 *
 * Expected input headers (case-insensitive): transaction_date, trade_date, ticker, company_name,
 * owner_name, Title, transaction_type, last_price, Qty, shares_held, Owned, Value
 *
 * Usage:
 *   node scripts/convert_sd3v_openinsider_csv.js path/to/insider_trades.csv > openinsider_transactions.csv
 *   node scripts/convert_sd3v_openinsider_csv.js insider_trades.csv ./out/openinsider_transactions.csv
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

function normHeader(h) {
  return String(h || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');
}

function csvEscape(val) {
  const s = String(val ?? '');
  if (/[,"\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function parseMoneyNum(v) {
  if (v == null || v === '') return '';
  const s = String(v).replace(/[$,\s]/g, '').trim();
  if (!s || /^n\/?a$/i.test(s)) return '';
  const n = parseFloat(s.replace(/^[+]/, ''));
  if (!Number.isFinite(n)) return '';
  return String(Math.round(Math.abs(n)));
}

function mapRow(raw) {
  const r = {};
  for (const [k, v] of Object.entries(raw)) {
    r[normHeader(k)] = v;
  }

  const transactionDate = r.transaction_date || r.filing_date || '';
  const tradeDate = r.trade_date || transactionDate;
  const ticker = (r.ticker || '').trim().toUpperCase();
  const companyName = (r.company_name || '').trim();
  const ownerName = (r.owner_name || '').trim();
  const title = (r.title || '').trim();
  let txType = (r.transaction_type || '').trim();
  if (txType && !txType.includes('-') && /^[A-Za-z]$/.test(txType)) {
    const map = {
      P: 'P - Purchase',
      S: 'S - Sale',
      A: 'A - Grant',
      F: 'F - Tax',
      G: 'G - Gift',
      M: 'M - Exercise',
      D: 'D - Sale',
    };
    txType = map[txType.toUpperCase()] || txType;
  }

  return {
    id: '',
    company_ticker: ticker,
    company_name: companyName || ticker,
    owner_name: ownerName,
    owner_title: title,
    is_institution: 'false',
    transaction_type: txType || 'Unknown',
    trade_date: tradeDate,
    transaction_date: transactionDate || tradeDate,
    last_price: String(r.last_price || '').replace(/,/g, ''),
    quantity: String(r.qty || r.quantity || '').replace(/,/g, ''),
    shares_held: String(r.shares_held || '').replace(/,/g, ''),
    owned: String(r.owned || r.Owned || ''),
    value: String(r.value || r.Value || '').replace(/,/g, ''),
    value_numeric: parseMoneyNum(r.value || r.Value) || '',
  };
}

const OUT_HEADERS = [
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
];

async function main() {
  const argv = process.argv.slice(2).filter((a) => !a.startsWith('-'));
  if (argv.length < 1) {
    console.error(
      'Usage: node scripts/convert_sd3v_openinsider_csv.js <input.csv> [output.csv]\n  (omit output.csv to write to stdout)',
    );
    process.exit(1);
  }
  const inputPath = path.resolve(argv[0]);
  const outputPath = argv[1] ? path.resolve(argv[1]) : null;

  if (!fs.existsSync(inputPath)) {
    console.error(`Input not found: ${inputPath}`);
    process.exit(1);
  }

  const rows = await new Promise((resolve, reject) => {
    const acc = [];
    fs.createReadStream(inputPath)
      .pipe(csv())
      .on('data', (row) => acc.push(row))
      .on('end', () => resolve(acc))
      .on('error', reject);
  });

  const lines = [OUT_HEADERS.join(',')];
  for (const raw of rows) {
    const m = mapRow(raw);
    lines.push(OUT_HEADERS.map((h) => csvEscape(m[h])).join(','));
  }
  const body = `${lines.join('\n')}\n`;

  if (outputPath) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, body, 'utf8');
    console.error(`Wrote ${rows.length} rows → ${outputPath}`);
  } else {
    process.stdout.write(body);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
