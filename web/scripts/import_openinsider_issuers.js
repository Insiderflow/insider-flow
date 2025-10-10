#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const prisma = new PrismaClient();

async function main() {
  try {
    const csvPath = path.resolve(__dirname, '../../..', 'opensecret', 'insider_trades_2023_2025.csv');
    if (!fs.existsSync(csvPath)) {
      console.error(`❌ CSV not found at ${csvPath}`);
      process.exit(1);
    }

    console.log('🚀 Importing issuers from OpenInsider CSV into Insider Flow DB');
    console.log(`📁 Source: ${csvPath}`);

    const seenTickers = new Set();
    let created = 0;
    let updated = 0;
    let skipped = 0;

    await new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (row) => {
          const ticker = (row.ticker || '').trim();
          const companyName = (row.company_name || '').trim();
          if (!ticker) {
            skipped++;
            return;
          }
          if (seenTickers.has(ticker)) {
            return;
          }
          seenTickers.add(ticker);
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // Upsert issuers by unique ticker
    for (const ticker of seenTickers) {
      try {
        const name = ticker; // fallback if we cannot find company_name below
        // Try to find a representative name by scanning a single matching line lazily
        // (best-effort; correctness: name can be updated later by other pipelines)
        let companyName = ticker;
        await new Promise((resolve) => {
          const stream = fs
            .createReadStream(csvPath)
            .pipe(csv());
          stream.on('data', (row) => {
            if ((row.ticker || '').trim() === ticker) {
              companyName = (row.company_name || ticker).trim();
              stream.destroy();
            }
          });
          stream.on('close', resolve);
          stream.on('end', resolve);
          stream.on('error', resolve);
        });

        const res = await prisma.issuer.upsert({
          where: { ticker },
          update: { name: companyName || name },
          create: {
            id: ticker, // use ticker as stable id if missing; safe due to String id
            ticker,
            name: companyName || name,
          },
        });

        if (res && res.createdAt && res.updatedAt && res.createdAt.getTime() === res.updatedAt.getTime()) {
          created++;
        } else {
          updated++;
        }
      } catch (e) {
        // If unique constraint by ticker collides with an existing issuer with the same ticker, this path still updates; other errors count as skipped
        skipped++;
      }
    }

    console.log(`✅ Done. Issuers processed: ${seenTickers.size}`);
    console.log(`   Created: ${created}, Updated: ${updated}, Skipped: ${skipped}`);
  } catch (err) {
    console.error('❌ Import failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();






