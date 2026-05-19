#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const STATE_DIR = path.join(ROOT, '.ci-state');
const STATE_FILE = path.join(STATE_DIR, 'import-streak-state.json');
const REPORT_FILE = path.join(ROOT, '.artifacts', 'import-streak-report.json');
const CAPITAL_IMPORT_FILE = path.join(ROOT, '.artifacts', 'last-capital-import.json');
const OPENINSIDER_IMPORT_FILE = path.join(ROOT, '.artifacts', 'openinsider-import-report.json');
const THRESHOLD = Number(process.env.ZERO_IMPORT_STREAK_FAIL_AFTER || '3');
const MAX_PUBLISH_STALE_HOURS = Number(process.env.ZERO_IMPORT_MAX_PUBLISH_STALE_HOURS || '72');
const MAX_OI_STALE_HOURS = Number(process.env.ZERO_IMPORT_MAX_OI_STALE_HOURS || '72');

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

function hoursSince(iso) {
  if (!iso) return Infinity;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return Infinity;
  return (Date.now() - t) / (1000 * 60 * 60);
}

function main() {
  const scrapeReport = readJson(path.join(ROOT, '.artifacts', 'daily-scrape-report.json'), null);
  if (!scrapeReport) {
    throw new Error('Missing .artifacts/daily-scrape-report.json — run finalize_daily_scrape_report.js first');
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
  const openInsiderImport = readJson(OPENINSIDER_IMPORT_FILE, null);

  let effectiveWork = Number(scrapeReport?.database?.importedDelta ?? 0);
  if (!effectiveWork && capitalImport) {
    effectiveWork =
      (Number(capitalImport.imported) || 0) + (Number(capitalImport.updated) || 0);
  }
  if (!effectiveWork && openInsiderImport) {
    effectiveWork += Number(openInsiderImport.imported) || 0;
  }

  const latestTradeDate =
    scrapeReport?.database?.latestTradeDate ||
    scrapeReport?.database?.max_capitol_published_at ||
    null;
  const latestOiFiling =
    scrapeReport?.database?.maxOpeninsiderFiling ||
    openInsiderImport?.dbLatestFiling ||
    null;

  const capitolFresh = hoursSince(latestTradeDate) <= MAX_PUBLISH_STALE_HOURS;
  const oiFresh =
    hoursSince(latestOiFiling) <= MAX_OI_STALE_HOURS ||
    Number(openInsiderImport?.staleHours ?? Infinity) <= MAX_OI_STALE_HOURS;

  const oiScraped = openInsiderImport
    ? Object.values(openInsiderImport.screenerByDay || {}).reduce((a, n) => a + Number(n || 0), 0) +
      Number(openInsiderImport.latestMatched || 0)
    : 0;

  /** Scrape ran and DB is current — 0 new rows means dedupe, not a broken pipeline. */
  const dedupeOnlyButFresh =
    effectiveWork <= 0 && capitolFresh && oiFresh && (oiScraped > 0 || capitalImport);

  const previous = readJson(STATE_FILE, { zeroImportStreak: 0, updatedAt: null });
  const isZeroImport = effectiveWork <= 0 && !dedupeOnlyButFresh;
  const zeroImportStreak = isZeroImport ? (previous.zeroImportStreak || 0) + 1 : 0;

  writeJson(STATE_FILE, {
    zeroImportStreak,
    updatedAt: new Date().toISOString(),
    lastEffectiveWork: effectiveWork,
    dedupeOnlyButFresh,
    latestTradeDate,
    latestOiFiling,
  });

  const result = {
    ok: zeroImportStreak < THRESHOLD,
    threshold: THRESHOLD,
    effectiveWork,
    dedupeOnlyButFresh,
    capitolFresh,
    oiFresh,
    oiScraped,
    capitalImport: capitalImport
      ? { imported: capitalImport.imported, updated: capitalImport.updated, skipped: capitalImport.skipped }
      : null,
    openInsiderImport: openInsiderImport
      ? { imported: openInsiderImport.imported, skippedDup: openInsiderImport.skippedDup }
      : null,
    latestTradeDate,
    latestOiFiling,
    zeroImportStreak,
    message: dedupeOnlyButFresh
      ? 'Dedupe-only run but Capitol + OpenInsider data are fresh — streak reset'
      : zeroImportStreak >= THRESHOLD
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
