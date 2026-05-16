#!/usr/bin/env node
/**
 * Import openinsider_filing_day_csv.js output into Prisma OpenInsider* tables.
 *
 *   cd web && node scripts/import_openinsider_filing_csv.js data/openinsider_filings_2026-05-15.csv
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { PrismaClient } = require('@prisma/client');
const { persistOpenInsiderRows } = require('./lib/openinsider_import_shared');

const prisma = new PrismaClient();

function parsePrice(v) {
  if (v == null || v === '') return null;
  const n = parseFloat(String(v).replace(/[$,]/g, ''));
  return Number.isFinite(n) ? n : null;
}

function parseValueNumeric(v) {
  if (v == null || v === '') return null;
  const n = parseFloat(String(v).replace(/[$,]/g, ''));
  return Number.isFinite(n) ? n : null;
}

function readCsv(filePath) {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => rows.push(row))
      .on('end', () => resolve(rows))
      .on('error', reject);
  });
}

function csvRowToTrade(row) {
  const filing = row.filing_date ? new Date(`${row.filing_date}T12:00:00.000Z`) : null;
  const traded = row.trade_date ? new Date(`${row.trade_date}T12:00:00.000Z`) : null;
  if (!filing || !traded || Number.isNaN(filing.getTime()) || Number.isNaN(traded.getTime())) {
    return null;
  }
  return {
    transactionDate: filing.toISOString(),
    tradeDate: traded.toISOString(),
    ticker: String(row.ticker || '').trim().toUpperCase(),
    companyName: String(row.company_name || row.ticker || '').trim(),
    ownerName: String(row.owner_name || '').trim(),
    title: String(row.title || '').trim(),
    transactionType: String(row.transaction_type || 'Unknown').trim(),
    lastPrice: parsePrice(row.price),
    quantity: String(row.quantity || ''),
    sharesHeld: String(row.shares_held || ''),
    owned: String(row.owned || ''),
    value: String(row.value || ''),
    valueNumeric: parseValueNumeric(row.value_numeric),
  };
}

async function main() {
  const filePath = path.resolve(process.argv[2] || 'data/openinsider_filings_2026-05-15.csv');
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const raw = await readCsv(filePath);
  const trades = raw.map(csvRowToTrade).filter(Boolean);
  console.log(`Parsed ${trades.length} rows from ${path.basename(filePath)}`);

  const summary = { imported: 0, skippedDup: 0, errors: 0, errorMessages: [] };
  await persistOpenInsiderRows(prisma, trades, summary, {
    perRowDelayMs: 0,
    perRowJitterMs: 0,
    stopAfterDuplicateStreak: 0,
  });

  const max = await prisma.openInsiderTransaction.aggregate({
    _max: { transactionDate: true },
    _count: true,
  });

  console.log(JSON.stringify({ filePath, ...summary, db: max }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
