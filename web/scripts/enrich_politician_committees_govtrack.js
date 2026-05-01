#!/usr/bin/env node
/**
 * Fill Politician.committees from GovTrack HTML (same Bioguide IDs as Capitol Trades, e.g. S001201).
 * Seat-alignment alerts need this text so inferSeatSectorFromCommittees() can map keywords → GICS.
 *
 * Usage:
 *   cd web && node scripts/enrich_politician_committees_govtrack.js [--dry-run] [--replace] [--limit N] [--sleep-ms 1200]
 *
 * Respect GovTrack—keep --sleep-ms reasonable; default 1200ms between requests.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes('--dry-run'),
    replace: args.includes('--replace'),
    limit: (() => {
      const i = args.indexOf('--limit');
      return i >= 0 && args[i + 1] ? parseInt(args[i + 1], 10) : null;
    })(),
    sleepMs: (() => {
      const i = args.indexOf('--sleep-ms');
      return i >= 0 && args[i + 1] ? parseInt(args[i + 1], 10) : 1200;
    })(),
  };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** @returns {string[] | null} */
function committeeNamesFromGovtrackHtml(html) {
  const reSection =
    /<h2>\s*<span>\s*Committee Membership\s*<\/span>\s*<\/h2>([\s\S]*?)<\/section>\s*<!--\s*\/membership\s*-->/i;
  const m = html.match(reSection);
  if (!m) return null;
  const block = m[1];
  const names = [];
  const linkRe = /<a href="\/congress\/committees\/[^"]+">([^<]+)<\/a>/gi;
  let mm;
  while ((mm = linkRe.exec(block)) !== null) {
    const name = mm[1].replace(/\s+/g, ' ').trim();
    if (name && !/^subcommittees$/i.test(name)) names.push(name);
  }
  return [...new Set(names)];
}

async function fetchGovtrackCommittees(bioguideId) {
  const id = String(bioguideId || '').trim().toUpperCase();
  const url = `https://www.govtrack.us/congress/members/${encodeURIComponent(id)}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'InsiderFlowCommitteeBot/1.0 (+https://www.insiderflow.asia; contact: abuse threshold respected)',
      Accept: 'text/html',
    },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${url}`);
  }
  const html = await res.text();
  const names = committeeNamesFromGovtrackHtml(html);
  return { url, names };
}

async function main() {
  const { dryRun, replace, limit, sleepMs } = parseArgs();

  const where = replace
    ? {}
    : {
        OR: [{ committees: null }, { committees: '' }],
      };

  let rows = await prisma.politician.findMany({
    where,
    select: { id: true, name: true, committees: true },
    orderBy: { id: 'asc' },
    ...(limit && Number.isFinite(limit) ? { take: limit } : {}),
  });

  console.log(JSON.stringify({ mode: dryRun ? 'dry-run' : 'apply', candidates: rows.length, replace }, null, 2));

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const prefix = `[${i + 1}/${rows.length}] ${row.id}`;
    try {
      const { names } = await fetchGovtrackCommittees(row.id);
      await sleep(sleepMs);

      if (!names || names.length === 0) {
        console.warn(`${prefix}: no committee section (GovTrack layout change or non-current member)`);
        skipped++;
        continue;
      }

      const committees = names.join('; ').slice(0, 4000);
      console.log(`${prefix} ${row.name || ''}: ${committees.slice(0, 160)}${committees.length > 160 ? '…' : ''}`);

      if (!dryRun) {
        await prisma.politician.update({
          where: { id: row.id },
          data: { committees },
        });
      }
      updated++;
    } catch (e) {
      errors++;
      console.error(`${prefix}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  console.log(JSON.stringify({ updated, skipped, errors, dryRun }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
