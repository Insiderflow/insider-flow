#!/usr/bin/env node

/**
 * Fails CI if OpenInsider corporate data (/insider, openInsiderTransaction) is missing or stale.
 * Capitol Trade freshness is handled separately by check_data_freshness.js.
 *
 * Env:
 *   OPENINSIDER_FRESHNESS_GUARD_DISABLED=1  — skip (emergency only)
 *   MAX_OPENINSIDER_STALENESS_DAYS=21       — max age of latest transactionDate (filing-side)
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function toDays(ms) {
  return ms / (1000 * 60 * 60 * 24);
}

async function main() {
  if (process.env.OPENINSIDER_FRESHNESS_GUARD_DISABLED === '1') {
    console.log(
      JSON.stringify(
        {
          status: 'skipped',
          reason: 'OPENINSIDER_FRESHNESS_GUARD_DISABLED=1',
        },
        null,
        2,
      ),
    );
    return;
  }

  const maxAgeDays = Number(process.env.MAX_OPENINSIDER_STALENESS_DAYS || '21');

  const agg = await prisma.openInsiderTransaction.aggregate({
    _max: { transactionDate: true },
    _count: { _all: true },
  });

  const latest = agg._max.transactionDate ? new Date(agg._max.transactionDate) : null;
  const now = Date.now();
  const ageDays = latest ? toDays(now - latest.getTime()) : Number.POSITIVE_INFINITY;

  const problems = [];
  if (agg._count._all === 0) {
    problems.push('No rows in openInsiderTransaction (企業交易 import never ran or DB empty)');
  }
  if (latest && ageDays > maxAgeDays) {
    problems.push(
      `Latest OpenInsider transactionDate is stale: ${latest.toISOString()} (${ageDays.toFixed(1)} days > ${maxAgeDays})`,
    );
  }
  if (!latest && agg._count._all > 0) {
    problems.push('Could not resolve max(transactionDate) on openInsiderTransaction');
  }

  console.log(
    JSON.stringify(
      {
        status: problems.length ? 'stale' : 'ok',
        thresholds: { maxOpenInsiderAgeDays: maxAgeDays },
        openInsider: {
          row_count: agg._count._all,
          latest_transaction_date: latest ? latest.toISOString() : null,
          age_days: Number.isFinite(ageDays) ? Number(ageDays.toFixed(2)) : null,
        },
      },
      null,
      2,
    ),
  );

  if (problems.length) {
    console.error('OpenInsider freshness guard failed:');
    for (const p of problems) console.error(`- ${p}`);
    process.exit(1);
  }
}

main()
  .catch((err) => {
    console.error('OpenInsider freshness guard crashed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
