#!/usr/bin/env node
/**
 * Finnhub bulk import for a calendar window (default: March–April of --year).
 * Writes:
 *   - Corporate insiders → OpenInsider* via persistOpenInsiderRows (same as OpenInsider CSV pipeline)
 *   - Congressional STOCK trades → Trade (+ Issuer/Politician upserts with fh_* ids where needed)
 *   - Institutional 13F-style snapshots → InstitutionalHoldingSnapshot
 *
 * Requires FINNHUB_API_KEY and DATABASE_URL (unless --dry-run with explicit --symbols).
 *
 * Examples:
 *   cd web && npx prisma migrate deploy
 *   FINNHUB_API_KEY=… DATABASE_URL=… node scripts/finnhub_range_import.js --preset march-april --year 2026 --max-symbols 150
 *   FINNHUB_API_KEY=… DATABASE_URL=… node scripts/finnhub_range_import.js --from 2026-03-01 --to 2026-04-30 --symbols AAPL,MSFT
 */

'use strict';

const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { finnhubGet } = require('./lib/finnhub_client');
const {
  dateStrInRange,
  finnhubInsiderTransactionToPersistRow,
  congressTypeToTradeSide,
  flattenInstitutionalOwnershipForPrisma,
} = require('./lib/finnhub_mappers');
const { persistOpenInsiderRows } = require('./lib/openinsider_import_shared');

const prisma = new PrismaClient();

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function stableHash(parts) {
  return crypto.createHash('sha256').update(parts.join('|')).digest('hex').slice(0, 28);
}

function politicianFinnhubId(name) {
  const n = String(name || '').trim().toLowerCase();
  return `fh_pol_${stableHash(['pol', n])}`;
}

function parseTradeDay(dayStr) {
  const iso = dayStr ? String(dayStr).slice(0, 10) : '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  return new Date(`${iso}T12:00:00.000Z`);
}

function parseArgs(argv) {
  let fromDay = null;
  let toDay = null;
  let year = new Date().getFullYear();
  let preset = null;
  let maxSymbols = 250;
  let sleepMs = 450;
  let dryRun = false;
  let skipInsider = false;
  let skipCongress = false;
  let skipInstitutional = false;
  let symbolsArg = null;
  let symbolsFile = null;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') dryRun = true;
    else if (a === '--no-insider') skipInsider = true;
    else if (a === '--no-congress') skipCongress = true;
    else if (a === '--no-institutional') skipInstitutional = true;
    else if (a === '--preset' && argv[i + 1]) {
      preset = argv[++i];
    } else if (a === '--year' && argv[i + 1]) {
      year = parseInt(argv[++i], 10) || year;
    } else if (a === '--from' && argv[i + 1]) {
      fromDay = argv[++i];
    } else if (a === '--to' && argv[i + 1]) {
      toDay = argv[++i];
    } else if (a === '--max-symbols' && argv[i + 1]) {
      maxSymbols = Math.min(5000, Math.max(1, parseInt(argv[++i], 10) || maxSymbols));
    } else if (a === '--sleep-ms' && argv[i + 1]) {
      sleepMs = Math.min(5000, Math.max(0, parseInt(argv[++i], 10) || sleepMs));
    } else if (a === '--symbols' && argv[i + 1]) {
      symbolsArg = argv[++i];
    } else if (a === '--symbols-file' && argv[i + 1]) {
      symbolsFile = argv[++i];
    }
  }

  if (!fromDay || !toDay) {
    if (preset === 'march-april') {
      fromDay = `${year}-03-01`;
      toDay = `${year}-04-30`;
    } else {
      fromDay = `${year}-03-01`;
      toDay = `${year}-04-30`;
    }
  }

  return {
    fromDay,
    toDay,
    year,
    maxSymbols,
    sleepMs,
    dryRun,
    skipInsider,
    skipCongress,
    skipInstitutional,
    symbolsArg,
    symbolsFile,
  };
}

async function loadSymbolsFromFile(filePath) {
  const abs = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
  const txt = await fs.readFile(abs, 'utf8');
  const set = new Set();
  for (const line of txt.split(/\r?\n/)) {
    const t = line.trim().split(/[\s,]/)[0];
    if (t && /^[A-Z.\-]{1,12}$/i.test(t)) set.add(t.toUpperCase());
  }
  return [...set];
}

async function loadSymbolsFromDb(maxSymbols) {
  const set = new Set();

  const issuers = await prisma.issuer.findMany({
    where: { ticker: { not: null } },
    select: { ticker: true },
    take: 8000,
  });
  for (const r of issuers) {
    if (r.ticker) set.add(String(r.ticker).toUpperCase());
  }

  const oi = await prisma.openInsiderCompany.findMany({ select: { ticker: true }, take: 8000 });
  for (const r of oi) set.add(r.ticker.toUpperCase());

  const trades = await prisma.trade.findMany({
    select: { Issuer: { select: { ticker: true } } },
    orderBy: { traded_at: 'desc' },
    take: 12000,
  });
  for (const r of trades) {
    if (r.Issuer?.ticker) set.add(String(r.Issuer.ticker).toUpperCase());
  }

  const sorted = [...set].sort();
  return sorted.slice(0, maxSymbols);
}

async function resolveIssuer(prismaClient, symbol, assetName) {
  const sym = symbol.toUpperCase();
  let issuer = await prismaClient.issuer.findFirst({
    where: { ticker: sym },
    orderBy: { created_at: 'asc' },
  });
  if (!issuer) {
    issuer = await prismaClient.issuer.create({
      data: {
        id: `fh_${sym}`,
        ticker: sym,
        name: String(assetName || sym).slice(0, 480),
      },
    });
  }
  return issuer;
}

async function upsertPolitician(prismaClient, ct) {
  const id = politicianFinnhubId(ct.name);
  const name = String(ct.name || '').trim();
  await prismaClient.politician.upsert({
    where: { id },
    create: {
      id,
      name,
      party: null,
      chamber: ct.position ? String(ct.position).slice(0, 120) : null,
      state: null,
      committees: null,
    },
    update: {
      name,
      chamber: ct.position ? String(ct.position).slice(0, 120) : undefined,
    },
  });
  return id;
}

async function persistCongressional(prismaClient, symbol, ct, summary) {
  const side = congressTypeToTradeSide(ct.transactionType);
  if (!side || !ct.name) return;

  const anchor = ct.transactionDate || ct.filingDate;
  if (!anchor || !summary.fromDay || !summary.toDay) return;
  if (!dateStrInRange(anchor, summary.fromDay, summary.toDay)) return;

  const tradedAt = parseTradeDay(ct.transactionDate || ct.filingDate);
  const publishedAt = parseTradeDay(ct.filingDate || ct.transactionDate);
  if (!tradedAt) return;

  const politicianId = await upsertPolitician(prismaClient, ct);
  const issuer = await resolveIssuer(prismaClient, symbol, ct.assetName);

  const dup = await prismaClient.trade.findFirst({
    where: {
      politician_id: politicianId,
      issuer_id: issuer.id,
      traded_at: tradedAt,
      type: side,
    },
  });
  if (dup) {
    summary.congressSkippedDup += 1;
    return;
  }

  const tradeId = `fh_ct_${stableHash(['ct', symbol, ct.name, ct.transactionDate, ct.transactionType, ct.filingDate, ct.amountFrom])}`;

  await prismaClient.trade.upsert({
    where: { id: tradeId },
    create: {
      id: tradeId,
      politician_id: politicianId,
      issuer_id: issuer.id,
      traded_at: tradedAt,
      published_at: publishedAt,
      filed_after_days: null,
      owner: ct.ownerType ? String(ct.ownerType).slice(0, 120) : null,
      type: side,
      size_min: ct.amountFrom != null ? ct.amountFrom : null,
      size_max: ct.amountTo != null ? ct.amountTo : null,
      price: null,
      source_url: null,
      raw: { source: 'finnhub', symbol },
    },
    update: {
      raw: { source: 'finnhub', symbol },
      published_at: publishedAt,
      owner: ct.ownerType ? String(ct.ownerType).slice(0, 120) : undefined,
      size_min: ct.amountFrom != null ? ct.amountFrom : undefined,
      size_max: ct.amountTo != null ? ct.amountTo : undefined,
    },
  });
  summary.congressInserted += 1;
}

async function main() {
  const token = process.env.FINNHUB_API_KEY || process.env.FINNHUB_TOKEN;
  const opts = parseArgs(process.argv.slice(2));

  if (!token) {
    console.error('FINNHUB_API_KEY required.');
    process.exit(1);
  }

  const universeFromDb = !opts.symbolsArg && !opts.symbolsFile;
  if (universeFromDb && !process.env.DATABASE_URL) {
    console.error('DATABASE_URL required when loading symbols from the database.');
    process.exit(1);
  }
  if (!opts.dryRun && !process.env.DATABASE_URL) {
    console.error('DATABASE_URL required for writes.');
    process.exit(1);
  }

  let symbols = [];
  if (opts.symbolsArg) {
    symbols = opts.symbolsArg.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);
  } else if (opts.symbolsFile) {
    symbols = await loadSymbolsFromFile(opts.symbolsFile);
    symbols = symbols.slice(0, opts.maxSymbols);
  } else {
    symbols = await loadSymbolsFromDb(opts.maxSymbols);
  }

  if (!symbols.length) {
    console.error('No symbols to process (empty DB universe?). Pass --symbols AAPL,MSFT');
    process.exit(1);
  }

  const summary = {
    fromDay: opts.fromDay,
    toDay: opts.toDay,
    symbolsQueued: symbols.length,
    dryRun: opts.dryRun,
    insiderRowsFetched: 0,
    insiderRowsInWindow: 0,
    insiderImported: 0,
    insiderSkippedDup: 0,
    insiderErrors: 0,
    congressRowsFetched: 0,
    congressInserted: 0,
    congressSkippedDup: 0,
    congressErrors: 0,
    institutionalRowsUpserted: 0,
    institutionalErrors: 0,
    symbolErrors: [],
  };

  console.log(JSON.stringify({ phase: 'start', ...opts, symbols: symbols.length }, null, 2));

  const cacheCompanyName = new Map();

  for (let i = 0; i < symbols.length; i++) {
    const symbol = symbols[i];
    try {
      let companyName = cacheCompanyName.get(symbol);
      if (!companyName) {
        try {
          const profile = await finnhubGet(token, '/stock/profile2', { symbol });
          companyName = profile.name || symbol;
        } catch {
          companyName = symbol;
        }
        cacheCompanyName.set(symbol, companyName);
      }

      if (!opts.skipInsider) {
        try {
          const ins = await finnhubGet(token, '/stock/insider-transactions', { symbol });
          const rows = Array.isArray(ins.data) ? ins.data : [];
          summary.insiderRowsFetched += rows.length;

          const persistRows = [];
          for (const t of rows) {
            const day = t.filingDate || t.transactionDate;
            if (!dateStrInRange(day, opts.fromDay, opts.toDay)) continue;
            const r = finnhubInsiderTransactionToPersistRow(t, { symbol, companyName });
            if (!r.transactionDate || !r.tradeDate) continue;
            persistRows.push(r);
          }
          summary.insiderRowsInWindow += persistRows.length;

          if (!opts.dryRun && persistRows.length) {
            const sub = {
              imported: 0,
              skippedDup: 0,
              errors: 0,
              errorMessages: [],
            };
            await persistOpenInsiderRows(prisma, persistRows, sub);
            summary.insiderImported += sub.imported;
            summary.insiderSkippedDup += sub.skippedDup;
            summary.insiderErrors += sub.errors;
          }
        } catch (e) {
          summary.insiderErrors += 1;
          summary.symbolErrors.push({ symbol, step: 'insider', msg: e.message });
        }
      }

      if (!opts.skipCongress) {
        try {
          const ct = await finnhubGet(token, '/stock/congressional-trading', {
            symbol,
            from: opts.fromDay,
            to: opts.toDay,
          });
          const rows = Array.isArray(ct.data) ? ct.data : [];
          summary.congressRowsFetched += rows.length;

          if (!opts.dryRun) {
            for (const row of rows) {
              try {
                await persistCongressional(prisma, symbol, row, summary);
              } catch (e) {
                summary.congressErrors += 1;
                summary.symbolErrors.push({ symbol, step: 'congress-row', msg: e.message });
              }
            }
          }
        } catch (e) {
          summary.congressErrors += 1;
          summary.symbolErrors.push({ symbol, step: 'congress', msg: e.message });
        }
      }

      if (!opts.skipInstitutional) {
        try {
          const io = await finnhubGet(token, '/stock/institutional-ownership', {
            symbol,
            from: opts.fromDay,
            to: opts.toDay,
          });
          const flat = flattenInstitutionalOwnershipForPrisma(symbol, io, opts.fromDay, opts.toDay);

          if (!opts.dryRun) {
            for (const row of flat) {
              try {
                await prisma.institutionalHoldingSnapshot.upsert({
                  where: { id: row.id },
                  create: row,
                  update: {
                    changeShares: row.changeShares,
                    sharesHeld: row.sharesHeld,
                    valueUsd: row.valueUsd,
                    pctPortfolio: row.pctPortfolio,
                    putCall: row.putCall,
                    investorCik: row.investorCik,
                  },
                });
                summary.institutionalRowsUpserted += 1;
              } catch (e) {
                summary.institutionalErrors += 1;
              }
            }
          }
        } catch (e) {
          summary.institutionalErrors += 1;
          summary.symbolErrors.push({ symbol, step: 'institutional', msg: e.message });
        }
      }
    } catch (e) {
      summary.symbolErrors.push({ symbol, step: 'symbol', msg: e.message });
    }

    if (opts.sleepMs > 0) await sleep(opts.sleepMs);

    if ((i + 1) % 25 === 0) {
      console.log(JSON.stringify({ progress: i + 1, total: symbols.length, ...summary }, null, 2));
    }
  }

  console.log(JSON.stringify({ phase: 'done', ...summary }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
