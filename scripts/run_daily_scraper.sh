#!/bin/bash

# Daily OpenInsider Scraper Script
# Runs OpenInsider scraper and imports data into database

# Set working directory
cd "/Users/kenyeung/Documents/Insider Flow/insider-flow/web"

# Create logs directory if it doesn't exist
mkdir -p "/Users/kenyeung/Documents/Insider Flow/insider-flow/scripts/logs"

# Log file with timestamp
LOG_FILE="/Users/kenyeung/Documents/Insider Flow/insider-flow/scripts/logs/cron.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$TIMESTAMP] Starting daily OpenInsider scraper..." >> "$LOG_FILE"

# Step 1: Import OpenInsider data (if CSV exists and data is missing)
echo "[$TIMESTAMP] Step 1: Checking OpenInsider data..." >> "$LOG_FILE"
cd "/Users/kenyeung/Documents/Insider Flow/insider-flow/web"

# Check if OpenInsider data exists
OPENINSIDER_COUNT=$(node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.openInsiderTransaction.count().then(count => {
  console.log(count);
  prisma.\$disconnect();
}).catch(() => {
  console.log('0');
  prisma.\$disconnect();
});
" 2>/dev/null)

if [ "$OPENINSIDER_COUNT" -eq 0 ] && [ -f "/Users/kenyeung/Documents/Insider Flow/opensecret/insider_trades_2023_2025.csv" ]; then
    echo "[$TIMESTAMP] OpenInsider data missing, importing from CSV..." >> "$LOG_FILE"
    if [ -f "scripts/import_openinsider_data.js" ]; then
        node scripts/import_openinsider_data.js >> "$LOG_FILE" 2>&1
        if [ $? -eq 0 ]; then
            echo "[$TIMESTAMP] OpenInsider data import completed successfully" >> "$LOG_FILE"
        else
            echo "[$TIMESTAMP] OpenInsider data import failed" >> "$LOG_FILE"
        fi
    else
        echo "[$TIMESTAMP] OpenInsider import script not found" >> "$LOG_FILE"
    fi
else
    echo "[$TIMESTAMP] OpenInsider data exists ($OPENINSIDER_COUNT transactions), skipping import" >> "$LOG_FILE"
fi

# Step 2: Run Capitol Trades scraper (faster, more recent data)
echo "[$TIMESTAMP] Step 2: Running Capitol Trades scraper..." >> "$LOG_FILE"

if [ -f "scripts/scrape_latest_trades.js" ]; then
    node scripts/scrape_latest_trades.js >> "$LOG_FILE" 2>&1
    if [ $? -eq 0 ]; then
        echo "[$TIMESTAMP] Capitol Trades scraper completed successfully" >> "$LOG_FILE"
    else
        echo "[$TIMESTAMP] Capitol Trades scraper failed" >> "$LOG_FILE"
    fi
else
    echo "[$TIMESTAMP] Capitol Trades scraper not found, skipping..." >> "$LOG_FILE"
fi

# Step 3: Import Capitol Trades data
echo "[$TIMESTAMP] Step 3: Importing Capitol Trades data..." >> "$LOG_FILE"
if [ -f "scripts/import_scraped_trades.js" ]; then
    # Find the latest scraped file
    LATEST_FILE=$(ls -t trades_pages_5_*.json 2>/dev/null | head -n 1)
    if [ -n "$LATEST_FILE" ]; then
        node scripts/import_scraped_trades.js "$LATEST_FILE" >> "$LOG_FILE" 2>&1
        if [ $? -eq 0 ]; then
            echo "[$TIMESTAMP] Capitol Trades data import completed successfully" >> "$LOG_FILE"
        else
            echo "[$TIMESTAMP] Capitol Trades data import failed" >> "$LOG_FILE"
        fi
    else
        echo "[$TIMESTAMP] No Capitol Trades data file found" >> "$LOG_FILE"
    fi
else
    echo "[$TIMESTAMP] Capitol Trades import script not found, skipping..." >> "$LOG_FILE"
fi

# Step 4: Clean up old files (keep only last 3)
echo "[$TIMESTAMP] Step 4: Cleaning up old files..." >> "$LOG_FILE"
cd "/Users/kenyeung/Documents/Insider Flow/insider-flow/web"
# Clean up old trade files (keep only last 3)
ls -t trades_pages_5_*.json 2>/dev/null | tail -n +4 | xargs rm -f 2>/dev/null || true
ls -t trades_scraped_*.json 2>/dev/null | tail -n +4 | xargs rm -f 2>/dev/null || true

# Step 5: Get final database stats
echo "[$TIMESTAMP] Step 5: Getting final database statistics..." >> "$LOG_FILE"
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getStats() {
  try {
    const tradeCount = await prisma.trade.count();
    const politicianCount = await prisma.politician.count();
    const issuerCount = await prisma.issuer.count();
    const latestTrade = await prisma.trade.findFirst({
      orderBy: { traded_at: 'desc' },
      select: { traded_at: true }
    });
    
    console.log(\`Database stats: \${tradeCount} trades, \${politicianCount} politicians, \${issuerCount} issuers\`);
    console.log(\`Latest trade: \${latestTrade?.traded_at?.toISOString().split('T')[0] || 'N/A'}\`);
  } catch (error) {
    console.error('Error getting stats:', error);
  } finally {
    await prisma.\$disconnect();
  }
}

getStats();
" >> "$LOG_FILE" 2>&1

echo "[$TIMESTAMP] Daily scraper completed successfully" >> "$LOG_FILE"
