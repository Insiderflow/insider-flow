#!/usr/bin/env node

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function scrapeTrades() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const allTrades = [];
  
  try {
    console.log('🚀 Starting to scrape latest trades from Capitol Trades...');
    
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
          if (cells.length >= 9) {
            // Capitol Trades table structure (based on debug output):
            // 0: Politician (with link)
            // 1: Issuer (with link) 
            // 2: Published Date
            // 3: Trade Date
            // 4: Days Filed After
            // 5: Owner
            // 6: Type (Buy/Sell)
            // 7: Size Range
            // 8: Price
            // 9: Empty (action button)
            
            // Extract clean politician name (remove party and chamber info)
            const politicianRaw = cells[0].textContent.trim();
            const politicianName = politicianRaw.replace(/(Republican|Democrat|Independent).*$/, '').trim();
            
            const issuerName = cells[1].textContent.trim();
            const publishedAt = cells[2].textContent.trim();
            const tradedAt = cells[3].textContent.trim();
            const filedAfterDays = cells[4].textContent.trim();
            const owner = cells[5].textContent.trim();
            const type = cells[6].textContent.trim();
            const sizeText = cells[7] ? cells[7].textContent.trim() : '';
            const priceText = cells[8] ? cells[8].textContent.trim() : '';
            
            // Extract IDs from links
            const politicianLink = cells[0].querySelector('a');
            const politicianId = politicianLink ? politicianLink.href.split('/').pop() : null;
            
            const issuerLink = cells[1].querySelector('a');
            const issuerId = issuerLink ? issuerLink.href.split('/').pop() : null;
            
            // Generate trade ID since there's no direct trade ID column
            const tradeId = `trade_${politicianId}_${issuerId}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
            const detailUrl = null; // No direct trade link in this structure
            
            // Parse size range (e.g., "$1,000 - $15,000" or "1K–15K")
            let sizeMin = null, sizeMax = null;
            if (sizeText) {
              // Handle different formats
              const sizeMatch = sizeText.match(/\$?(\d+(?:,\d{3})*(?:\.\d+)?)\s*[–-]\s*\$?(\d+(?:,\d{3})*(?:\.\d+)?)/);
              if (sizeMatch) {
                sizeMin = parseFloat(sizeMatch[1].replace(/,/g, ''));
                sizeMax = parseFloat(sizeMatch[2].replace(/,/g, ''));
              } else {
                // Try K/M/B format
                const sizeMatchKMB = sizeText.match(/(\d+(?:\.\d+)?)([KMB]?)\s*[–-]\s*(\d+(?:\.\d+)?)([KMB]?)/);
                if (sizeMatchKMB) {
                  const minVal = parseFloat(sizeMatchKMB[1]);
                  const maxVal = parseFloat(sizeMatchKMB[3]);
                  const minUnit = sizeMatchKMB[2];
                  const maxUnit = sizeMatchKMB[4];
                  
                  sizeMin = minVal * (minUnit === 'K' ? 1000 : minUnit === 'M' ? 1000000 : minUnit === 'B' ? 1000000000 : 1);
                  sizeMax = maxVal * (maxUnit === 'K' ? 1000 : maxUnit === 'M' ? 1000000 : maxUnit === 'B' ? 1000000000 : 1);
                }
              }
            }
            
            // Parse price
            let price = null;
            if (priceText && priceText !== 'N/A') {
              const priceMatch = priceText.match(/\$?(\d+(?:\.\d+)?)/);
              if (priceMatch) {
                price = parseFloat(priceMatch[1]);
              }
            }
            
            // Parse dates
            const parseDate = (dateStr) => {
              if (!dateStr || dateStr === 'N/A') return null;
              
              // Handle different date formats
              const today = new Date();
              const currentYear = today.getFullYear();
              
              // Handle "13:05Today" format (published date)
              if (dateStr.includes('Today')) {
                const timeMatch = dateStr.match(/(\d{1,2}):(\d{2})/);
                if (timeMatch) {
                  const hours = parseInt(timeMatch[1]);
                  const minutes = parseInt(timeMatch[2]);
                  const date = new Date(today);
                  date.setHours(hours, minutes, 0, 0);
                  return date.toISOString();
                }
                return today.toISOString();
              }
              
              // Handle "23 Sept2025" format (traded date)
              if (dateStr.includes('Sept') || dateStr.includes('Sep')) {
                const match = dateStr.match(/(\d+)\s+(\w+)(\d{4})/);
                if (match) {
                  const day = parseInt(match[1]);
                  const month = match[2];
                  const year = parseInt(match[3]);
                  const monthNum = month === 'Sept' || month === 'Sep' ? 8 : 0; // September is month 8 (0-indexed)
                  const date = new Date(year, monthNum, day);
                  return date.toISOString();
                }
              }
              
              // Handle "daysXX" format (days since trade)
              if (dateStr.startsWith('days')) {
                const days = parseInt(dateStr.replace('days', ''));
                const tradeDate = new Date(today);
                tradeDate.setDate(tradeDate.getDate() - days);
                return tradeDate.toISOString();
              }
              
              // Try parsing as regular date
              try {
                const parsed = new Date(dateStr);
                if (isNaN(parsed.getTime())) {
                  return null;
                }
                return parsed.toISOString();
              } catch (e) {
                return null;
              }
            };
            
            const publishedDate = parseDate(publishedAt);
            const tradeDate = parseDate(tradedAt);
            
            // Only include trades with valid data
            if (politicianId && issuerId && tradeDate && type) {
              tradeData.push({
                tradeId: tradeId || `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                politicianId,
                politicianName,
                politicianChamber: null, // Will be filled later
                issuerId,
                issuerName,
                ticker: null, // Will be filled later
                publishedAt: publishedDate,
                tradedAt: tradeDate,
                filedAfterDays: filedAfterDays ? parseInt(filedAfterDays) : null,
                owner,
                type: type.toLowerCase(),
                sizeMin,
                sizeMax,
                sizeText,
                price,
                detailUrl
              });
            }
          }
        });
        
        return tradeData;
      });
      
      allTrades.push(...trades);
      console.log(`✅ Found ${trades.length} valid trades on page ${pageNum}`);
      
      // Small delay between pages
      await page.waitForTimeout(2000);
    }
    
    // Save to JSON file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `trades_scraped_${timestamp}.json`;
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
scrapeTrades()
  .then(result => {
    console.log(`🎉 Successfully scraped ${result.trades.length} trades`);
    console.log(`📁 File saved as: ${result.filename}`);
  })
  .catch(error => {
    console.error('💥 Scraping failed:', error);
    process.exit(1);
  });