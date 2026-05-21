#!/usr/bin/env node
/**
 * Import Capitol rows newer than DB max published_at (with overlap).
 * Fixes day-bucket sync missing afternoon disclosures still stamped "yesterday" UTC.
 *
 *   DOTENV_CONFIG_PATH=.env.local node scripts/sync_capitol_recent.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const ROOT = path.join(__dirname, '..');
const OVERLAP_HOURS = Number(process.env.CAPITOL_RECENT_OVERLAP_HOURS || '12');

async function main() {
  const tradeMax = await prisma.trade.aggregate({ _max: { published_at: true } });
  const maxPub = tradeMax._max.published_at;
  const watermark = maxPub
    ? new Date(maxPub.getTime() - OVERLAP_HOURS * 60 * 60 * 1000)
    : new Date(Date.now() - 48 * 60 * 60 * 1000);

  console.log(`\n🔄 Capitol recent sync (published_at > ${watermark.toISOString()})\n`);

  process.env.SCRAPE_MAX_PAGES = process.env.SCRAPE_MAX_PAGES || '5';
  process.env.SCRAPE_PAGE_DELAY_MS = process.env.SCRAPE_PAGE_DELAY_MS || '400';
  const { scrapeTrades } = require('./scrape_trades_fixed');
  const { trades } = await scrapeTrades();

  const fresh = trades.filter((t) => {
    if (!t.publishedAt) return false;
    return new Date(t.publishedAt).getTime() > watermark.getTime();
  });

  console.log(`[capitol] scraped ${trades.length} → ${fresh.length} newer than watermark`);

  if (!fresh.length) {
    console.log(JSON.stringify({ imported: 0, skipped: 0, watermark: watermark.toISOString(), maxPub: maxPub?.toISOString() ?? null }, null, 2));
    return;
  }

  const tmp = path.join(ROOT, `.sync_capitol_recent_${Date.now()}.json`);
  fs.writeFileSync(tmp, JSON.stringify(fresh, null, 2));
  execSync(`node scripts/import_scraped_trades.js "${tmp}"`, {
    cwd: ROOT,
    stdio: 'inherit',
    env: process.env,
  });
  try {
    fs.unlinkSync(tmp);
  } catch {
    /* ok */
  }

  const artifact = path.join(ROOT, '.artifacts', 'last-capital-import.json');
  const imp = fs.existsSync(artifact) ? JSON.parse(fs.readFileSync(artifact, 'utf8')) : {};
  const newMax = await prisma.trade.aggregate({ _max: { published_at: true } });
  console.log(
    JSON.stringify(
      {
        watermark: watermark.toISOString(),
        priorMaxPublished: maxPub?.toISOString() ?? null,
        newMaxPublished: newMax._max.published_at?.toISOString() ?? null,
        scrapedFresh: fresh.length,
        ...imp,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
