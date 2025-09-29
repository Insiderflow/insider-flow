#!/usr/bin/env node

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function scrapeLatestTrades() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const allTrades = [];
  
  try {
    console.log('🚀 Starting to scrape latest trades...');
    
    // Scrape first 5 pages
    for (let pageNum = 1; pageNum <= 5; pageNum++) {
      console.log(`📄 Scraping page ${pageNum}...`);
      
      const url = `https://www.capitoltrades.com/trades?page=${pageNum}`;
      await page.goto(url, { waitUntil: 'networkidle' });
      
      // Wait for the table to load
      await page.waitForSelector('table tbody tr', { timeout: 10000 });
      
      // Extract trade data from table rows
      const trades = await page.evaluate(() => {
        const rows = document.querySelectorAll('table tbody tr');
        const tradeData = [];
        
        rows.forEach(row => {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 8) {
            const tradeId = cells[0].textContent.trim();
            const politicianName = cells[1].textContent.trim();
            const issuerName = cells[2].textContent.trim();
            const publishedAt = cells[3].textContent.trim();
            const tradedAt = cells[4].textContent.trim();
            const filedAfterDays = cells[5].textContent.trim();
            const owner = cells[6].textContent.trim();
            const type = cells[7].textContent.trim();
            const sizeText = cells[8] ? cells[8].textContent.trim() : '';
            
            // Extract politician ID from link
            const politicianLink = cells[1].querySelector('a');
            const politicianId = politicianLink ? politicianLink.href.split('/').pop() : null;
            
            // Extract issuer ID from link
            const issuerLink = cells[2].querySelector('a');
            const issuerId = issuerLink ? issuerLink.href.split('/').pop() : null;
            
            // Extract trade ID from link
            const tradeLink = cells[0].querySelector('a');
            const detailUrl = tradeLink ? tradeLink.href : null;
            
            // Parse size range
            let sizeMin = null, sizeMax = null;
            if (sizeText) {
              const sizeMatch = sizeText.match(/(\d+(?:\.\d+)?)([KMB]?)\s*[–-]\s*(\d+(?:\.\d+)?)([KMB]?)/);
              if (sizeMatch) {
                const minVal = parseFloat(sizeMatch[1]);
                const maxVal = parseFloat(sizeMatch[3]);
                const minUnit = sizeMatch[2];
                const maxUnit = sizeMatch[4];
                
                sizeMin = minVal * (minUnit === 'K' ? 1000 : minUnit === 'M' ? 1000000 : minUnit === 'B' ? 1000000000 : 1);
                sizeMax = maxVal * (maxUnit === 'K' ? 1000 : maxUnit === 'M' ? 1000000 : maxUnit === 'B' ? 1000000000 : 1);
              }
            }
            
            tradeData.push({
              tradeId,
              politicianId,
              politicianName,
              politicianChamber: null,
              issuerId,
              issuerName,
              ticker: null,
              publishedAt,
              tradedAt,
              filedAfterDays: parseInt(filedAfterDays) || null,
              owner,
              type,
              sizeMin,
              sizeMax,
              sizeText,
              price: null,
              detailUrl
            });
          }
        });
        
        return tradeData;
      });
      
      allTrades.push(...trades);
      console.log(`✅ Found ${trades.length} trades on page ${pageNum}`);
      
      // Small delay between pages
      await page.waitForTimeout(1000);
    }
    
    // Save to JSON file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `trades_pages_5_${timestamp}.json`;
    const filepath = path.join(__dirname, '..', filename);
    
    fs.writeFileSync(filepath, JSON.stringify(allTrades, null, 2));
    console.log(`💾 Saved ${allTrades.length} trades to ${filename}`);
    
    return { filename, trades: allTrades };
    
  } catch (error) {
    console.error('❌ Scraping failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the scraper
scrapeLatestTrades()
  .then(result => {
    console.log(`🎉 Successfully scraped ${result.trades.length} trades`);
    console.log(`📁 File saved as: ${result.filename}`);
  })
  .catch(error => {
    console.error('💥 Scraping failed:', error);
    process.exit(1);
  });

