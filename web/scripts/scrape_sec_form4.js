#!/usr/bin/env node

/**
 * SEC Form 4 Scraper
 * 
 * This script scrapes Form 4 filings from SEC EDGAR database
 * 
 * Sources:
 * - Direct SEC EDGAR: https://www.sec.gov/cgi-bin/browse-edgar
 * - Bulk data: https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent
 * 
 * Usage:
 *   node scripts/scrape_sec_form4.js
 * 
 * Note: SEC has strict rate limits (max 10 requests/second, must identify user agent)
 */

const { PrismaClient } = require('@prisma/client');
const https = require('https');
const http = require('http');
const cheerio = require('cheerio');

const prisma = new PrismaClient();

// SEC user agent requirement (SEC requires this in headers)
const SEC_HEADERS = {
  'User-Agent': 'Insider Flow insiderflow.asia contact@insiderflow.asia',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive'
};

/**
 * Fetch HTML from SEC EDGAR
 */
async function fetchFromSEC(url, retries = 3) {
  return new Promise((resolve, reject) => {
    const request = https.request(url, { 
      headers: SEC_HEADERS,
      timeout: 30000
    }, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        if (response.statusCode === 200) {
          resolve(data);
        } else if (response.statusCode === 429 && retries > 0) {
          // Rate limited, wait and retry
          console.log(`Rate limited, waiting 10 seconds...`);
          setTimeout(() => {
            fetchFromSEC(url, retries - 1).then(resolve).catch(reject);
          }, 10000);
        } else {
          reject(new Error(`HTTP ${response.statusCode}: ${url}`));
        }
      });
    });
    
    request.on('error', (error) => {
      reject(error);
    });
    
    request.on('timeout', () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
    
    request.end();
  });
}

/**
 * Parse SEC filing HTML to extract Form 4 data
 */
function parseForm4(html) {
  const $ = cheerio.load(html);
  const trades = [];
  
  // SEC Form 4 structure varies, this is a basic parser
  // You'll need to customize based on actual SEC HTML structure
  
  // Try to find table with transaction data
  $('table').each((i, table) => {
    const rows = $(table).find('tr');
    
    rows.each((j, row) => {
      const cells = $(row).find('td, th');
      const rowData = [];
      
      cells.each((k, cell) => {
        rowData.push($(cell).text().trim());
      });
      
      if (rowData.length > 5) {
        // Likely a data row
        trades.push(rowData);
      }
    });
  });
  
  return trades;
}

/**
 * Scrape recent Form 4 filings
 */
async function scrapeRecentForm4s(days = 7) {
  try {
    console.log(`🔍 Scraping Form 4 filings from last ${days} days...`);
    
    // SEC EDGAR search URL for recent Form 4 filings
    const searchUrl = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=4&company=&dateb=&owner=include&start=0&count=100`;
    
    console.log(`📥 Fetching from SEC: ${searchUrl}`);
    const html = await fetchFromSEC(searchUrl);
    
    // Parse the HTML to find Form 4 links
    const $ = cheerio.load(html);
    const filings = [];
    
    // Find all Form 4 links
    $('a').each((i, element) => {
      const href = $(element).attr('href');
      const text = $(element).text().trim();
      
      if (href && href.includes('CIK') && text) {
        filings.push({
          url: `https://www.sec.gov${href}`,
          company: text
        });
      }
    });
    
    console.log(`📊 Found ${filings.length} Form 4 filings`);
    
    // Process each filing (with rate limiting)
    for (let i = 0; i < Math.min(filings.length, 10); i++) {
      const filing = filings[i];
      console.log(`\n📄 Processing filing ${i + 1}/${filings.length}: ${filing.company}`);
      
      try {
        // Fetch the actual Form 4
        const form4Html = await fetchFromSEC(filing.url);
        const trades = parseForm4(form4Html);
        
        console.log(`   Found ${trades.length} transactions`);
        
        // Parse and store trades here
        // Implementation depends on your schema
        
        // Rate limit: SEC requires max 10 requests/second
        await new Promise(resolve => setTimeout(resolve, 200)); // 200ms = 5 req/sec
      } catch (error) {
        console.error(`   Error processing ${filing.company}:`, error.message);
      }
    }
    
    console.log(`\n✅ Scraping completed`);
    
  } catch (error) {
    console.error('❌ Error scraping Form 4s:', error);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Alternative: Use SEC RSS feed (easiest approach)
 */
async function scrapeForm4RSS(days = 7) {
  try {
    console.log(`🔍 Fetching Form 4 RSS feed...`);
    
    // SEC EDGAR RSS feed for Form 4 filings
    const rssUrl = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=4&company=&dateb=&owner=include&start=0&count=100&output=atom`;
    
    console.log(`📥 Fetching RSS from SEC: ${rssUrl}`);
    const xml = await fetchFromSEC(rssUrl);
    
    const $ = cheerio.load(xml, { xmlMode: true });
    const entries = [];
    
    $('entry').each((i, entry) => {
      const title = $(entry).find('title').text();
      const link = $(entry).find('link').attr('href');
      const updated = $(entry).find('updated').text();
      const summary = $(entry).find('summary').text();
      
      entries.push({
        title,
        link,
        updated,
        summary
      });
    });
    
    console.log(`📊 Found ${entries.length} recent Form 4 filings`);
    
    entries.slice(0, 10).forEach((entry, i) => {
      console.log(`${i + 1}. ${entry.title}`);
      console.log(`   ${entry.link}`);
      console.log(`   Updated: ${entry.updated}`);
    });
    
  } catch (error) {
    console.error('❌ Error fetching Form 4 RSS:', error);
  }
}

// Export functions
module.exports = { scrapeRecentForm4s, scrapeForm4RSS, fetchFromSEC };

// Run if called directly
if (require.main === module) {
  scrapeForm4RSS().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

















