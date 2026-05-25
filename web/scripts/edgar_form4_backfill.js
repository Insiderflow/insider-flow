#!/usr/bin/env node
/**
 * Form 4 backfill: edgartools (SEC) → CSV → Prisma OpenInsider* tables.
 *
 *   npm run edgar:form4-backfill -- --days 90
 *   npm run edgar:form4-backfill -- --from 2025-11-01 --to 2026-05-16
 *   npm run edgar:form4-backfill -- --days 7 --export-only
 *   npm run edgar:form4-backfill -- --days 3 --import-only --csv data/edgar_form4.csv
 *
 * Env: EDGAR_IDENTITY or SEC_IDENTITY (email for SEC), DATABASE_URL
 * Requires: pip install edgartools
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const out = {
    days: null,
    from: null,
    to: null,
    out: null,
    chunkDays: 7,
    maxFilings: 0,
    sleepMs: 80,
    exportOnly: false,
    importOnly: false,
    csv: null,
    dryRun: false,
    python: process.env.EDGAR_PYTHON || 'python3',
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--days' && argv[i + 1]) out.days = argv[++i];
    else if (a === '--from' && argv[i + 1]) out.from = argv[++i];
    else if (a === '--to' && argv[i + 1]) out.to = argv[++i];
    else if ((a === '-o' || a === '--out') && argv[i + 1]) out.out = argv[++i];
    else if (a === '--chunk-days' && argv[i + 1]) out.chunkDays = argv[++i];
    else if (a === '--max-filings' && argv[i + 1]) out.maxFilings = argv[++i];
    else if (a === '--sleep-ms' && argv[i + 1]) out.sleepMs = argv[++i];
    else if (a === '--export-only') out.exportOnly = true;
    else if (a === '--import-only') out.importOnly = true;
    else if (a === '--csv' && argv[i + 1]) out.csv = argv[++i];
    else if (a === '--dry-run') out.dryRun = true;
    else if (a === '--python' && argv[i + 1]) out.python = argv[++i];
  }
  return out;
}

function run(cmd, args, label) {
  console.log(`\n> ${label}: ${cmd} ${args.join(' ')}`);
  const r = spawnSync(cmd, args, {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
    env: process.env,
  });
  if (r.status !== 0) {
    process.exit(r.status ?? 1);
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const exportScript = path.join(__dirname, 'edgar_form4_export.py');

  if (!args.importOnly) {
    const pyArgs = [exportScript];
    if (args.days) pyArgs.push('--days', String(args.days));
    if (args.from) pyArgs.push('--from', args.from);
    if (args.to) pyArgs.push('--to', args.to);
    if (args.out) pyArgs.push('-o', args.out);
    pyArgs.push('--chunk-days', String(args.chunkDays));
    if (args.maxFilings) pyArgs.push('--max-filings', String(args.maxFilings));
    pyArgs.push('--sleep-ms', String(args.sleepMs));
    if (args.dryRun) pyArgs.push('--dry-run');

    if (!args.days && !args.from) {
      console.error('Use --days N or --from YYYY-MM-DD [--to YYYY-MM-DD]');
      process.exit(1);
    }

    run(args.python, pyArgs, 'edgar export');
  }

  if (args.exportOnly) return;

  let csvPath = args.csv;
  if (!csvPath && args.out) csvPath = args.out;
  if (!csvPath && args.from && args.to) {
    csvPath = path.join(
      __dirname,
      '..',
      'data',
      `edgar_form4_${args.from}_${args.to}.csv`,
    );
  }
  if (!csvPath && args.days) {
    const end = new Date();
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - (Number(args.days) - 1));
    const fmt = (d) => d.toISOString().slice(0, 10);
    csvPath = path.join(
      __dirname,
      '..',
      'data',
      `edgar_form4_${fmt(start)}_${fmt(end)}.csv`,
    );
  }

  if (!csvPath || !fs.existsSync(path.resolve(csvPath))) {
    console.error(`CSV not found for import: ${csvPath || '(unset)'}`);
    process.exit(1);
  }

  run('node', ['scripts/import_openinsider_filing_csv.js', path.resolve(csvPath)], 'prisma import');
}

main();
