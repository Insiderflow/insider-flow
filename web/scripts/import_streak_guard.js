#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const STATE_DIR = path.join(ROOT, '.ci-state');
const STATE_FILE = path.join(STATE_DIR, 'import-streak-state.json');
const REPORT_FILE = path.join(ROOT, '.artifacts', 'import-streak-report.json');
const CAPITAL_IMPORT_FILE = path.join(ROOT, '.artifacts', 'last-capital-import.json');
const THRESHOLD = Number(process.env.ZERO_IMPORT_STREAK_FAIL_AFTER || '3');

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf8');
}

function main() {
  const scrapeReport = readJson(path.join(ROOT, '.artifacts', 'daily-scrape-report.json'), null);
  if (!scrapeReport) {
    throw new Error('Missing .artifacts/daily-scrape-report.json');
  }

  if (scrapeReport.status !== 'success') {
    const result = {
      ok: true,
      skipped: true,
      reason: 'daily_scrape_not_success',
      status: scrapeReport.status,
      error: scrapeReport.error || null,
    };
    writeJson(REPORT_FILE, result);
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  }

  const capitalImport = readJson(CAPITAL_IMPORT_FILE, null);
  const importedDelta = Number(scrapeReport?.database?.importedDelta ?? 0);
  /** Prefer real Capitol import counts (new rows + disclosure merges). DB row-count delta misses updates-only runs. */
  let effectiveWork = importedDelta;
  if (capitalImport && Number.isFinite(Number(capitalImport.imported))) {
    effectiveWork =
      (Number(capitalImport.imported) || 0) + (Number(capitalImport.updated) || 0);
  }

  const previous = readJson(STATE_FILE, { zeroImportStreak: 0, updatedAt: null });
  const latestTradeDate = scrapeReport?.database?.latestTradeDate || null;
  const isZeroImport = effectiveWork <= 0;
  const zeroImportStreak = isZeroImport ? (previous.zeroImportStreak || 0) + 1 : 0;

  const state = {
    zeroImportStreak,
    updatedAt: new Date().toISOString(),
    lastEffectiveWork: effectiveWork,
    lastImportedDelta: importedDelta,
    latestTradeDate,
  };
  writeJson(STATE_FILE, state);

  const result = {
    ok: zeroImportStreak < THRESHOLD,
    threshold: THRESHOLD,
    importedDelta,
    effectiveWork,
    capitalImport: capitalImport
      ? { imported: capitalImport.imported, updated: capitalImport.updated, skipped: capitalImport.skipped }
      : null,
    latestTradeDate,
    zeroImportStreak,
    message:
      zeroImportStreak >= THRESHOLD
        ? `Zero-import streak reached ${zeroImportStreak} (threshold ${THRESHOLD})`
        : `Zero-import streak ${zeroImportStreak}/${THRESHOLD - 1}`,
  };
  writeJson(REPORT_FILE, result);
  console.log(JSON.stringify(result, null, 2));

  if (!result.ok) {
    process.exit(2);
  }
}

try {
  main();
} catch (error) {
  console.error('import_streak_guard_failed', error instanceof Error ? error.message : String(error));
  process.exit(1);
}
