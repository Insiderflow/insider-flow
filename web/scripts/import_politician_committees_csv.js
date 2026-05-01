#!/usr/bin/env node
/**
 * Upsert Politician.committees from CSV.
 *
 * Columns (header row required): politician_id, committees
 * committees may be quoted (commas OK inside quotes).
 *
 * Usage:
 *   cd web && node scripts/import_politician_committees_csv.js ./committees.csv
 */

const fs = require('fs');
const csv = require('csv-parser');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const file = process.argv[2];
  if (!file || !fs.existsSync(file)) {
    console.error('Usage: node scripts/import_politician_committees_csv.js <path/to.csv>');
    process.exit(1);
  }

  const rows = [];
  await new Promise((resolve, reject) => {
    fs.createReadStream(file)
      .pipe(csv())
      .on('data', (row) => rows.push(row))
      .on('end', resolve)
      .on('error', reject);
  });

  let ok = 0;
  let missing = 0;

  for (const row of rows) {
    const id = String(row.politician_id || row.id || '').trim();
    const committees = String(row.committees || row.committee_text || '').trim().slice(0, 4000);
    if (!id || !committees) continue;

    const exists = await prisma.politician.findUnique({ where: { id }, select: { id: true } });
    if (!exists) {
      console.warn(`skip unknown politician_id: ${id}`);
      missing++;
      continue;
    }

    await prisma.politician.update({
      where: { id },
      data: { committees },
    });
    ok++;
  }

  console.log(JSON.stringify({ importedRows: ok, unknownPoliticianId: missing, csvLines: rows.length }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
