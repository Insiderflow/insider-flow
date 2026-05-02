#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const DEFAULT_MIN_ROWS = Number(process.env.SCRAPE_MIN_ROWS || 80);
const DEFAULT_MIN_VALID_RATIO = Number(process.env.SCRAPE_MIN_VALID_RATIO || 0.7);

function isValidDate(value) {
  if (!value) return false;
  const d = new Date(value);
  return !Number.isNaN(d.getTime());
}

function validateRows(rows) {
  let valid = 0;
  let validDateRows = 0;
  let withIds = 0;
  const issues = [];

  for (const row of rows) {
    const hasIds = Boolean(row.politicianId && row.issuerId);
    const hasTradeDate = isValidDate(row.tradedAt);
    const hasType = Boolean(row.type && String(row.type).trim());

    if (hasIds) withIds++;
    if (hasTradeDate) validDateRows++;
    if (hasIds && hasTradeDate && hasType) valid++;
  }

  const ratio = rows.length ? valid / rows.length : 0;

  if (rows.length < DEFAULT_MIN_ROWS) {
    issues.push(`row_count_below_threshold:${rows.length}<${DEFAULT_MIN_ROWS}`);
  }
  if (ratio < DEFAULT_MIN_VALID_RATIO) {
    issues.push(`valid_ratio_below_threshold:${ratio.toFixed(2)}<${DEFAULT_MIN_VALID_RATIO}`);
  }
  if (withIds < Math.ceil(rows.length * 0.6)) {
    issues.push(`id_coverage_low:${withIds}/${rows.length}`);
  }
  if (validDateRows < Math.ceil(rows.length * 0.7)) {
    issues.push(`date_parse_coverage_low:${validDateRows}/${rows.length}`);
  }

  return {
    rowCount: rows.length,
    validRows: valid,
    validRatio: ratio,
    idCoverage: withIds,
    dateCoverage: validDateRows,
    issues,
    ok: issues.length === 0,
  };
}

function runValidation(filePath) {
  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : path.join(process.cwd(), filePath);
  const raw = fs.readFileSync(absolutePath, 'utf8');
  const rows = JSON.parse(raw);
  if (!Array.isArray(rows)) {
    throw new Error('Scraped payload is not an array');
  }
  const result = validateRows(rows);
  return { ...result, filePath: absolutePath };
}

if (require.main === module) {
  try {
    const fileArg = process.argv[2];
    if (!fileArg) {
      throw new Error('Usage: node scripts/validate_scraped_trades.js <scraped-file.json>');
    }
    const result = runValidation(fileArg);
    console.log(JSON.stringify(result, null, 2));
    if (!result.ok) process.exit(2);
  } catch (error) {
    console.error('validation_failed', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

module.exports = {
  runValidation,
};
