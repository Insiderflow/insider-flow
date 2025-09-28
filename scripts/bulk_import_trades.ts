import { PrismaClient } from '../generated/prisma/index.js';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

interface TradeData {
  id: string;
  politician_id: string;
  issuer_id: string;
  traded_at: string;
  type: string;
  size_min?: number;
  size_max?: number;
  published_at?: string;
  filed_after_days?: number;
  owner?: string;
  price?: number;
  source_url?: string;
  raw: any;
  created_at: string;
}

function parseSQLFile(filePath: string): TradeData[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const trades: TradeData[] = [];
  
  // Extract VALUES from INSERT statement
  const valuesMatch = content.match(/VALUES\s*\((.*)\);$/s);
  if (!valuesMatch) {
    throw new Error('Could not find VALUES in SQL file');
  }
  
  const valuesString = valuesMatch[1];
  
  // Split by ),( to get individual trade entries
  const tradeEntries = valuesString.split('),(');
  
  for (const entry of tradeEntries) {
    // Clean up the entry
    let cleanEntry = entry.trim();
    if (cleanEntry.startsWith('(')) cleanEntry = cleanEntry.substring(1);
    if (cleanEntry.endsWith(')')) cleanEntry = cleanEntry.substring(0, cleanEntry.length - 1);
    
    // Parse the values - this is a simplified parser
    const values = parseValues(cleanEntry);
    
    if (values.length >= 14) {
      trades.push({
        id: values[0],
        politician_id: values[1],
        issuer_id: values[2],
        traded_at: values[3],
        type: values[4],
        size_min: values[5] ? parseFloat(values[5]) : undefined,
        size_max: values[6] ? parseFloat(values[6]) : undefined,
        published_at: values[7] || undefined,
        filed_after_days: values[8] ? parseInt(values[8]) : undefined,
        owner: values[9] || undefined,
        price: values[10] ? parseFloat(values[10]) : undefined,
        source_url: values[11] || undefined,
        raw: values[12] ? JSON.parse(values[12]) : {},
        created_at: values[13]
      });
    }
  }
  
  return trades;
}

function parseValues(entry: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = '';
  let i = 0;
  
  while (i < entry.length) {
    const char = entry[i];
    
    if (!inQuotes && (char === "'" || char === '"')) {
      inQuotes = true;
      quoteChar = char;
      current += char;
    } else if (inQuotes && char === quoteChar) {
      // Check if it's escaped
      if (i + 1 < entry.length && entry[i + 1] === quoteChar) {
        current += char + char;
        i++; // Skip next quote
      } else {
        inQuotes = false;
        current += char;
      }
    } else if (!inQuotes && char === ',') {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
    i++;
  }
  
  if (current.trim()) {
    values.push(current.trim());
  }
  
  return values;
}

async function importTradesInBatches(trades: TradeData[], batchSize: number = 1000) {
  console.log(`Starting import of ${trades.length} trades in batches of ${batchSize}...`);
  
  let imported = 0;
  const totalBatches = Math.ceil(trades.length / batchSize);
  
  for (let i = 0; i < trades.length; i += batchSize) {
    const batch = trades.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    
    console.log(`Processing batch ${batchNum}/${totalBatches} (${batch.length} trades)...`);
    
    try {
      // Use createMany for bulk insert
      await prisma.trade.createMany({
        data: batch.map(trade => ({
          id: trade.id,
          politicianId: trade.politician_id,
          issuerId: trade.issuer_id,
          tradedAt: new Date(trade.traded_at),
          type: trade.type,
          sizeMin: trade.size_min?.toString(),
          sizeMax: trade.size_max?.toString(),
          publishedAt: trade.published_at ? new Date(trade.published_at) : null,
          filedAfterDays: trade.filed_after_days,
          owner: trade.owner,
          price: trade.price?.toString(),
          sourceUrl: trade.source_url,
          raw: trade.raw,
          createdAt: new Date(trade.created_at)
        })),
        skipDuplicates: true // Skip duplicates instead of failing
      });
      
      imported += batch.length;
      console.log(`✅ Batch ${batchNum} completed. Total imported: ${imported}/${trades.length}`);
      
      // Small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`❌ Error in batch ${batchNum}:`, error);
      // Continue with next batch
    }
  }
  
  console.log(`🎉 Import completed! Total trades imported: ${imported}`);
}

async function main() {
  try {
    const sqlFilePath = path.join(__dirname, '../web/all_trades.sql');
    console.log('Reading SQL file:', sqlFilePath);
    
    const trades = parseSQLFile(sqlFilePath);
    console.log(`Parsed ${trades.length} trades from SQL file`);
    
    // Import in batches of 1000
    await importTradesInBatches(trades, 1000);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
