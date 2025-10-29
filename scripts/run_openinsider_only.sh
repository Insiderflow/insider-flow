#!/bin/bash

set -euo pipefail

BASE_DIR="/Users/kenyeung/Documents/Insider Flow/insider-flow"
WEB_DIR="$BASE_DIR/web"
LOG_DIR="$BASE_DIR/scripts/logs"
LOG_FILE="$LOG_DIR/openinsider_cron.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

mkdir -p "$LOG_DIR"

echo "[$TIMESTAMP] Starting OpenInsider-only import" >> "$LOG_FILE"

cd "$WEB_DIR"

# Run Node import for OpenInsider CSV (idempotent if data unchanged)
if [ -f "scripts/import_openinsider_data.js" ]; then
  echo "[$TIMESTAMP] Running import_openinsider_data.js" >> "$LOG_FILE"
  node scripts/import_openinsider_data.js >> "$LOG_FILE" 2>&1 || echo "[$TIMESTAMP] import_openinsider_data.js failed" >> "$LOG_FILE"
else
  echo "[$TIMESTAMP] import_openinsider_data.js not found" >> "$LOG_FILE"
fi

# Final DB stats
node -e '
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
(async () => {
  try {
    const count = await prisma.openInsiderTransaction.count();
    const latest = await prisma.openInsiderTransaction.findFirst({ orderBy: { transactionDate: "desc" }, select: { transactionDate: true } });
    console.log(`[${new Date().toISOString()}] OpenInsider rows: ${count}, Latest: ${latest?.transactionDate?.toISOString()?.split("T")[0] || 'N/A'}`);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
})();
' >> "$LOG_FILE" 2>&1 || true

echo "[$TIMESTAMP] OpenInsider-only import complete" >> "$LOG_FILE"


