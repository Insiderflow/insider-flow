#!/usr/bin/env node

/**
 * Daily Scraper Script
 * This script runs daily to update the database with new data
 * Can be scheduled with cron jobs or GitHub Actions
 */

const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { runValidation } = require('./validate_scraped_trades');

const prisma = new PrismaClient();
const ROOT = path.join(__dirname, '..');
const ARTIFACTS_DIR = path.join(ROOT, '.artifacts');

/**
 * Corporate insider (/insider) data — isolated from politician Capitol flow.
 * Never throws; failures are logged only so Trade import + CI guards stay authoritative.
 */
function runOptionalOpenInsiderImport() {
  if (process.env.OPENINSIDER_IMPORT_DISABLED === '1') {
    console.log('⏭️ OpenInsider import skipped (OPENINSIDER_IMPORT_DISABLED=1)');
    return;
  }
  console.log('📎 Optional step: OpenInsider corporate insiders → DB...');
  try {
    execSync('node scripts/openinsider_daily_import.js', {
      cwd: ROOT,
      stdio: 'inherit',
      timeout: 600_000,
      env: process.env,
    });
    console.log('✅ OpenInsider optional step finished');
  } catch (e) {
    console.warn(
      '⚠️ OpenInsider import failed (non-fatal for politician pipeline):',
      e instanceof Error ? e.message : String(e),
    );
  }
}

function findLatestFileByPrefix(prefixes) {
  const files = fs
    .readdirSync(ROOT)
    .filter((f) => prefixes.some((p) => f.startsWith(p)) && f.endsWith('.json'))
    .sort();
  if (!files.length) return null;
  return path.join(ROOT, files[files.length - 1]);
}

async function dailyScrape() {
  const startedAt = new Date().toISOString();
  const report = {
    startedAt,
    finishedAt: null,
    source: null,
    selectedFile: null,
    validation: null,
    fallbackValidation: null,
    database: {
      beforeTradeCount: null,
      afterTradeCount: null,
      importedDelta: null,
      latestTradeDate: null,
      politicianCount: null,
      issuerCount: null,
    },
    status: 'running',
    error: null,
  };
  try {
    console.log('🚀 Starting daily scrape...');
    console.log(`📅 Date: ${new Date().toISOString()}`);
    fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
    try {
      fs.unlinkSync(path.join(ARTIFACTS_DIR, 'last-capital-import.json'));
    } catch {
      /* no stale import stats from a previous partial run */
    }
    report.database.beforeTradeCount = await prisma.trade.count();
    
    // Step 1: Run primary scraper + validation gate
    console.log('📊 Step 1: Scraping latest trades from Capitol Trades (primary)...');
    let selectedFile = null;
    let selectedSource = 'primary';
    try {
      execSync('node scripts/scrape_trades_fixed.js', { 
        stdio: 'inherit',
        cwd: ROOT
      });
      const primaryFile = findLatestFileByPrefix(['trades_scraped_']);
      if (!primaryFile) {
        throw new Error('Primary scraper did not produce output file');
      }
      const primaryValidation = runValidation(primaryFile);
      console.log(`🧪 Primary validation: ${JSON.stringify(primaryValidation)}`);
      report.validation = primaryValidation;
      if (!primaryValidation.ok) {
        throw new Error(`Primary validation failed: ${primaryValidation.issues.join(', ')}`);
      }
      selectedFile = primaryFile;
      console.log(`✅ Primary scrape validated: ${path.basename(selectedFile)}`);
    } catch (error) {
      console.error('⚠️ Primary scrape/validation failed:', error.message);
      console.log('🔁 Running fallback scraper...');
      execSync('node scripts/scrape_latest_trades.js', {
        stdio: 'inherit',
        cwd: ROOT,
      });
      const fallbackFile = findLatestFileByPrefix(['trades_pages_5_']);
      if (!fallbackFile) {
        throw new Error('Fallback scraper did not produce output file');
      }
      const fallbackValidation = runValidation(fallbackFile);
      console.log(`🧪 Fallback validation: ${JSON.stringify(fallbackValidation)}`);
      report.fallbackValidation = fallbackValidation;
      if (!fallbackValidation.ok) {
        throw new Error(`Fallback validation failed: ${fallbackValidation.issues.join(', ')}`);
      }
      selectedFile = fallbackFile;
      selectedSource = 'fallback';
      console.log(`✅ Fallback scrape validated: ${path.basename(selectedFile)}`);
    }
    report.source = selectedSource;
    report.selectedFile = selectedFile;
    
    // Step 2: Import the scraped data
    console.log(`📥 Step 2: Importing scraped data into database (${selectedSource})...`);
    try {
      execSync(`node scripts/import_scraped_trades.js "${selectedFile}"`, { 
        stdio: 'inherit',
        cwd: ROOT
      });
      console.log('✅ Import completed');
    } catch (error) {
      console.error('❌ Import failed:', error.message);
      throw error;
    }
    
    // Step 3: Clean up old scraped files (keep only last 3)
    console.log('🧹 Step 3: Cleaning up old files...');
    try {
      const files = fs
        .readdirSync(ROOT)
        .filter(
          (f) =>
            (f.startsWith('trades_scraped_') || f.startsWith('trades_pages_5_')) &&
            f.endsWith('.json'),
        );
      if (files.length > 3) {
        const filesToDelete = files.sort().slice(0, files.length - 3);
        filesToDelete.forEach(file => {
          fs.unlinkSync(path.join(ROOT, file));
          console.log(`🗑️  Deleted old file: ${file}`);
        });
      }
    } catch (error) {
      console.log('⚠️  Cleanup failed (non-critical):', error.message);
    }
    
    // Step 4: Get final database stats
    console.log('📊 Step 4: Final database statistics...');
    const politicianCount = await prisma.politician.count();
    const tradeCount = await prisma.trade.count();
    const issuerCount = await prisma.issuer.count();
    
    // Get latest trade date
    const latestTrade = await prisma.trade.findFirst({
      orderBy: { traded_at: 'desc' },
      select: { traded_at: true }
    });
    
    console.log('✅ Daily scrape completed successfully!');
    console.log(`📊 Database stats: ${politicianCount} politicians, ${tradeCount} trades, ${issuerCount} issuers`);
    console.log(`📅 Latest trade date: ${latestTrade?.traded_at?.toISOString().split('T')[0] || 'N/A'}`);
    report.database.afterTradeCount = tradeCount;
    report.database.importedDelta =
      report.database.beforeTradeCount == null ? null : tradeCount - report.database.beforeTradeCount;
    report.database.latestTradeDate = latestTrade?.traded_at?.toISOString() || null;
    report.database.politicianCount = politicianCount;
    report.database.issuerCount = issuerCount;
    report.status = 'success';

    try {
      runOptionalOpenInsiderImport();
    } catch (optionalErr) {
      console.warn(
        '⚠️ OpenInsider wrapper error (ignored):',
        optionalErr instanceof Error ? optionalErr.message : String(optionalErr),
      );
    }

  } catch (error) {
    console.error('❌ Daily scrape failed:', error);
    report.status = 'failed';
    report.error = error instanceof Error ? error.message : String(error);
    process.exit(1);
  } finally {
    report.finishedAt = new Date().toISOString();
    try {
      fs.writeFileSync(
        path.join(ARTIFACTS_DIR, 'daily-scrape-report.json'),
        JSON.stringify(report, null, 2),
        'utf8',
      );
      if (report.selectedFile && fs.existsSync(report.selectedFile)) {
        const target = path.join(ARTIFACTS_DIR, path.basename(report.selectedFile));
        fs.copyFileSync(report.selectedFile, target);
      }
    } catch (artifactError) {
      console.error('⚠️ Failed writing scrape artifacts:', artifactError);
    }
    await prisma.$disconnect();
  }
}

// Run the scraper
dailyScrape();
