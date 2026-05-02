#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function toHours(ms) {
  return ms / (1000 * 60 * 60);
}

function toDays(ms) {
  return ms / (1000 * 60 * 60 * 24);
}

async function main() {
  const maxTradeAgeDays = Number(process.env.MAX_TRADE_STALENESS_DAYS || '14');
  const maxPublishAgeHours = Number(process.env.MAX_PUBLISH_STALENESS_HOURS || '72');

  const latest = await prisma.trade.aggregate({
    _max: { traded_at: true, published_at: true },
    _count: { _all: true },
  });

  const now = Date.now();
  const latestTrade = latest._max.traded_at ? new Date(latest._max.traded_at) : null;
  const latestPublished = latest._max.published_at ? new Date(latest._max.published_at) : null;

  const tradeAgeDays = latestTrade ? toDays(now - latestTrade.getTime()) : Number.POSITIVE_INFINITY;
  const publishAgeHours = latestPublished ? toHours(now - latestPublished.getTime()) : Number.POSITIVE_INFINITY;

  const problems = [];
  if (!latestTrade) problems.push('No trades found in Trade table');
  if (!latestPublished) problems.push('No published_at found in Trade table');
  if (latestTrade && tradeAgeDays > maxTradeAgeDays) {
    problems.push(
      `Latest traded_at is stale: ${latestTrade.toISOString()} (${tradeAgeDays.toFixed(1)} days old > ${maxTradeAgeDays} days)`,
    );
  }
  if (latestPublished && publishAgeHours > maxPublishAgeHours) {
    problems.push(
      `Latest published_at is stale: ${latestPublished.toISOString()} (${publishAgeHours.toFixed(1)} hours old > ${maxPublishAgeHours} hours)`,
    );
  }

  console.log(
    JSON.stringify(
      {
        status: problems.length ? 'stale' : 'ok',
        thresholds: { maxTradeAgeDays, maxPublishAgeHours },
        latest: {
          traded_at: latestTrade ? latestTrade.toISOString() : null,
          published_at: latestPublished ? latestPublished.toISOString() : null,
          total_trades: latest._count._all,
        },
        ages: {
          traded_at_days: Number.isFinite(tradeAgeDays) ? Number(tradeAgeDays.toFixed(2)) : null,
          published_at_hours: Number.isFinite(publishAgeHours) ? Number(publishAgeHours.toFixed(2)) : null,
        },
      },
      null,
      2,
    ),
  );

  if (problems.length) {
    console.error('Data freshness guard failed:');
    for (const p of problems) console.error(`- ${p}`);
    process.exit(1);
  }
}

main()
  .catch((err) => {
    console.error('Freshness guard crashed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
