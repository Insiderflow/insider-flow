#!/usr/bin/env node
/**
 * Fetch Finnhub (2) insider-transactions + (3) institutional-ownership for one symbol,
 * print mapping into existing CSV shapes (admin import + standalone 13F CSV).
 *
 *   cd web && FINNHUB_API_KEY=... node scripts/finnhub_csv_study.js AAPL
 *   FINNHUB_API_KEY=... node scripts/finnhub_csv_study.js MSFT --write exports/finnhub_sample
 *
 * No key in repo — use env only.
 */

'use strict';

const fs = require('fs/promises');
const path = require('path');
const {
  finnhubInsiderToOpenInsiderCsvRow,
  finnhubInstitutionalToCsvRow,
  rowToCsvLine,
  OPENINSIDER_TX_CSV_HEADERS,
  INSTITUTIONAL_CSV_HEADERS,
} = require('./lib/finnhub_mappers');
const { finnhubGet } = require('./lib/finnhub_client');

function parseArgs() {
  const argv = process.argv.slice(2);
  let symbol = 'AAPL';
  let outPrefix = null;
  let limit = 15;

  const wi = argv.indexOf('--write');
  if (wi >= 0 && argv[wi + 1]) outPrefix = argv[wi + 1];

  const li = argv.indexOf('--limit');
  if (li >= 0 && argv[li + 1]) limit = Math.min(100, Math.max(1, parseInt(argv[li + 1], 10) || 15));

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--write' || a === '--limit') {
      i += 1;
      continue;
    }
    if (a.startsWith('--')) continue;
    symbol = a.toUpperCase();
    break;
  }

  return { symbol, outPrefix, limit };
}

async function main() {
  const token = process.env.FINNHUB_API_KEY || process.env.FINNHUB_TOKEN;
  const { symbol, outPrefix, limit } = parseArgs();

  if (!token) {
    console.error('Set FINNHUB_API_KEY in the environment.');
    process.exit(1);
  }

  const now = new Date();
  const to = now.toISOString().slice(0, 10);
  const from = new Date(now);
  from.setFullYear(from.getFullYear() - 1);
  const fromStr = from.toISOString().slice(0, 10);

  console.log(JSON.stringify({ phase: 'start', symbol, institutional_from: fromStr, institutional_to: to }, null, 2));

  let companyName = symbol;
  try {
    const profile = await finnhubGet(token, '/stock/profile2', { symbol });
    if (profile.name) companyName = profile.name;
    console.log('\n--- company profile2 (for CSV company_name) ---\n', profile.name || profile.ticker);
  } catch (e) {
    console.warn('profile2 failed', e.message);
  }

  /** @type {object} */
  let insiderJson = {};
  try {
    insiderJson = await finnhubGet(token, '/stock/insider-transactions', { symbol });
  } catch (e) {
    console.error('insider-transactions failed:', e.message);
    throw e;
  }

  const insiderRows = Array.isArray(insiderJson.data) ? insiderJson.data : [];
  console.log('\n--- (2) Insider transactions — raw count:', insiderRows.length);
  console.log('Sample keys first row:', insiderRows[0] ? Object.keys(insiderRows[0]) : []);

  const mappedInsider = insiderRows.slice(0, limit).map((t) =>
    finnhubInsiderToOpenInsiderCsvRow(t, { symbol, companyName }),
  );

  console.log('\n--- Mapped to admin CSV dataset `openinsider_transactions` (first row sample):');
  if (mappedInsider[0]) console.log(mappedInsider[0]);

  let instJson = {};
  try {
    const instParams = { symbol, from: fromStr, to };
    instJson = await finnhubGet(token, '/stock/institutional-ownership', instParams);
  } catch (e) {
    console.warn('institutional-ownership failed (tier/plan or params):', e.message);
  }

  const groups = Array.isArray(instJson.data) ? instJson.data : [];
  let flatInst = [];
  for (const g of groups) {
    const rd = g.reportDate || '';
    const owns = Array.isArray(g.ownership) ? g.ownership : [];
    for (const o of owns) {
      flatInst.push(finnhubInstitutionalToCsvRow(instJson.symbol || symbol, instJson.cusip || '', rd, o));
    }
  }
  console.log('\n--- (3) Institutional ownership (13F-style) — report groups:', groups.length, 'flattened rows:', flatInst.length);
  if (flatInst[0]) console.log('Sample:', flatInst[0]);

  console.log('\n--- Fit summary ---');
  console.log(
    '(2) Maps directly to existing Prisma/OpenInsider CSV import: same columns as adminCsvImport openinsider_transactions (company_ticker, company_name, owner_name, transaction_type, trade_date, transaction_date, …). Use Admin Ops CSV import or runAdminCsvImport programmatically.',
  );
  console.log(
    '(3) Does NOT match openinsider_* tables (those are corporate insider Form 4). Institutional rows need a new Prisma model + dataset key, or store as standalone CSV until schema exists.',
  );

  if (outPrefix) {
    const dir = path.dirname(outPrefix);
    if (dir && dir !== '.') await fs.mkdir(dir, { recursive: true });
    const insPath = `${outPrefix}_openinsider_transactions.csv`;
    const instPath = `${outPrefix}_institutional_13f_snapshots.csv`;

    const insLines = [
      OPENINSIDER_TX_CSV_HEADERS.join(','),
      ...mappedInsider.map((r) => rowToCsvLine(r, OPENINSIDER_TX_CSV_HEADERS)),
    ];
    const instLines = [
      INSTITUTIONAL_CSV_HEADERS.join(','),
      ...flatInst.slice(0, 500).map((r) => rowToCsvLine(r, INSTITUTIONAL_CSV_HEADERS)),
    ];

    await fs.writeFile(insPath, insLines.join('\n') + '\n', 'utf8');
    await fs.writeFile(instPath, instLines.join('\n') + '\n', 'utf8');
    console.log('\nWrote:', insPath, instPath);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
