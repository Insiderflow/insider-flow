#!/usr/bin/env node
/** Merge Capitol + OpenInsider artifact stats into daily-scrape-report.json for CI guards. */

const fs = require('fs');
const path = require('path');

const ARTIFACTS = path.join(__dirname, '..', '.artifacts');

function readJson(file, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function main() {
  const daily = readJson(path.join(ARTIFACTS, 'daily-scrape-report.json'), {
    status: 'success',
    source: 'sync_published_day',
    database: {},
  });
  const capitol = readJson(path.join(ARTIFACTS, 'last-capital-import.json'), null);
  const openinsider = readJson(path.join(ARTIFACTS, 'openinsider-import-report.json'), null);

  const capitolWork =
    (Number(capitol?.imported) || 0) + (Number(capitol?.updated) || 0);
  const openinsiderWork = Number(openinsider?.imported) || 0;

  daily.status = daily.status || 'success';
  daily.finishedAt = new Date().toISOString();
  daily.database = daily.database || {};
  daily.database.importedDelta = capitolWork + openinsiderWork;
  daily.database.capitolImported = Number(capitol?.imported) || 0;
  daily.database.capitolUpdated = Number(capitol?.updated) || 0;
  daily.database.openinsiderImported = openinsiderWork;
  daily.database.latestTradeDate =
    daily.database.latestTradeDate || null;
  daily.database.maxOpeninsiderFiling = openinsider?.dbLatestFiling || null;
  daily.openinsider = openinsider
    ? {
        scraped: Object.values(openinsider.screenerByDay || {}).reduce((a, b) => a + b, 0),
        imported: openinsiderWork,
        staleHours: openinsider.staleHours,
      }
    : null;

  fs.mkdirSync(ARTIFACTS, { recursive: true });
  fs.writeFileSync(path.join(ARTIFACTS, 'daily-scrape-report.json'), JSON.stringify(daily, null, 2), 'utf8');
  console.log(JSON.stringify(daily, null, 2));
}

main();
