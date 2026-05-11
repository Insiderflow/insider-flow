#!/usr/bin/env node
/**
 * Capitol / politician pipeline only — skips OpenInsider (企業交易).
 * Same as daily-scrape.js with OPENINSIDER_IMPORT_DISABLED=1 preset.
 *
 *   cd web && DATABASE_URL="..." node scripts/capitol_only_daily.js
 */
process.env.OPENINSIDER_IMPORT_DISABLED = '1';
require('./daily-scrape.js');
