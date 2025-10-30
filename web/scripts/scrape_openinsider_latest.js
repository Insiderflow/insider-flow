#!/usr/bin/env node

/**
 * OpenInsider Latest Trades Scraper
 * Tests scraping latest trades from openinsider.com
 * Uses Playwright to bypass bot protection
 */

const { chromium } = require('playwright');

async function scrapeOpenInsiderLatest() {
  console.log('🚀 Starting OpenInsider scraper test...');
  console.log('🔧 Launching visible Chrome browser (incognito mode)...');
  console.log('📌 Browser will open on your screen - you can interact with it if needed');
  
  let browser;
  try {
    // Try to use system Chrome first
    browser = await chromium.launch({ 
      headless: false, // Show browser window
      channel: 'chrome', // Use system Chrome if available
      args: [
        '--incognito', // Incognito mode
        '--disable-blink-features=AutomationControlled', // Hide automation
        '--disable-dev-shm-usage',
      ]
    });
  } catch (error) {
    console.log('⚠️  System Chrome not found, using Playwright Chromium...');
    // Fallback to Playwright's bundled Chromium
    browser = await chromium.launch({ 
      headless: false, // Show browser window
      args: [
        '--incognito', // Incognito mode
        '--disable-blink-features=AutomationControlled', // Hide automation
        '--disable-dev-shm-usage',
      ]
    });
  }
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    locale: 'en-US',
    timezoneId: 'America/New_York',
  });
  
  // Hide automation indicators
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
    });
    
    // Override permissions
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) => (
      parameters.name === 'notifications' ?
        Promise.resolve({ state: Notification.permission }) :
        originalQuery(parameters)
    );
  });
  
  const page = await context.newPage();
  
  try {
    // Navigate to latest insider trades page
    const url = 'https://openinsider.com/latest-cluster-insider-trades';
    console.log(`📄 Navigating to: ${url}`);
    console.log(`⏳ Timeout: 60 seconds...`);
    console.log(`\n💡 If you see a captcha or blocking page, solve it manually in the browser window`);
    console.log(`   The script will wait and continue automatically...\n`);
    
    let pageLoaded = false;
    try {
      await page.goto(url, { 
        waitUntil: 'domcontentloaded', 
        timeout: 60000 
      });
      console.log('✅ Page loaded!');
      pageLoaded = true;
    } catch (error) {
      console.error('⚠️  Initial page load failed:', error.message);
      console.log('\n💡 If the browser window shows the page:');
      console.log('   - You can manually interact (solve captcha, etc.)');
      console.log('   - The script will continue after a wait...\n');
      // Don't throw - continue anyway in case page is loading in browser
    }
    
    // Wait a bit for page to fully render
    console.log('⏳ Waiting for page to fully render...');
    await page.waitForTimeout(3000);
    
    // Check if user needs to solve something
    let pageContent = '';
    let hasBlocking = false;
    try {
      pageContent = await page.content();
      hasBlocking = pageContent.includes('captcha') || 
                   pageContent.includes('blocked') || 
                   pageContent.includes('challenge') ||
                   pageContent.includes('Cloudflare');
      
      if (hasBlocking) {
        console.log('\n⚠️  Detection: Page may require manual interaction (captcha/blocking)');
        console.log('📌 Please solve any captcha or confirm access in the browser window');
        console.log('⏳ Waiting 30 seconds for you to interact...');
        await page.waitForTimeout(30000);
        console.log('⏳ Checking if page is ready...');
      }
    } catch (error) {
      console.log('⚠️  Could not check page content, continuing anyway...');
      console.log('💡 If browser window is open, you can manually navigate/interact');
      console.log('⏳ Waiting 15 seconds for manual interaction...');
      try {
        await page.waitForTimeout(15000);
      } catch (e) {
        // Page might be closed, continue anyway
      }
    }
    
    // Refresh page content after potential manual interaction
    await page.waitForTimeout(2000);
    
    // Check page title/content to confirm we got the right page
    const title = await page.title();
    console.log(`📋 Page title: ${title}`);
    
    // Wait for the table to load - try multiple selectors
    console.log('⏳ Waiting for table to load...');
    let tableSelector = null;
    
    const selectors = [
      'table.tinytable tbody tr',
      'table tbody tr',
      'table.tinytable tr',
      '.tinytable tbody tr',
    ];
    
    for (const selector of selectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        tableSelector = selector;
        console.log(`✅ Table found with selector: ${selector}`);
        break;
      } catch (e) {
        // Try next selector
      }
    }
    
    if (!tableSelector) {
      console.log('⚠️  No table found with standard selectors, checking page structure...');
      const pageText = await page.evaluate(() => document.body.innerText);
      console.log('\nPage text sample (first 1000 chars):');
      console.log(pageText.substring(0, 1000));
      throw new Error('Could not find table on page');
    }
    
    console.log('✅ Page loaded successfully, extracting test data...');
    
    // Extract trade data from table rows (TEST ONLY - NO IMPORT)
    const trades = await page.evaluate((selector) => {
      const rows = document.querySelectorAll(selector);
      const results = [];
      
      rows.forEach((row, index) => {
        const cols = row.querySelectorAll('td');
        if (cols.length >= 13) {
          try {
            // Column order: X, Filing Date, Trade Date, Ticker, Company Name, Insider Name, Title, Trade Type, Price, Qty, Owned, ΔOwn, Value
            const filingDateText = cols[1].querySelector('a')?.textContent?.trim() || cols[1].textContent?.trim() || '';
            const tradeDateText = cols[2].textContent?.trim() || '';
            const ticker = cols[3].querySelector('a')?.textContent?.trim() || cols[3].textContent?.trim() || '';
            const companyName = cols[4].querySelector('a')?.textContent?.trim() || cols[4].textContent?.trim() || '';
            const ownerName = cols[5].querySelector('a')?.textContent?.trim() || cols[5].textContent?.trim() || '';
            const title = cols[6].textContent?.trim() || '';
            const transactionType = cols[7].textContent?.trim() || '';
            const priceText = cols[8].textContent?.trim() || '';
            const quantity = cols[9].textContent?.trim() || '';
            const owned = cols[10].textContent?.trim() || '';
            const sharesHeld = cols[11].textContent?.trim() || '';
            const valueText = cols[12].textContent?.trim() || '';
            
            // Parse dates (format: MM/DD/YYYY)
            const parseDate = (dateStr) => {
              if (!dateStr) return null;
              const parts = dateStr.split('/');
              if (parts.length === 3) {
                return new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
              }
              return null;
            };
            
            // Parse price (remove $)
            const parsePrice = (priceStr) => {
              if (!priceStr) return null;
              return parseFloat(priceStr.replace(/[$,]/g, '')) || null;
            };
            
            // Parse value (remove $ and commas)
            const parseValue = (valueStr) => {
              if (!valueStr) return null;
              const cleaned = valueStr.replace(/[$,]/g, '');
              // Handle values like "+$957,083" or "-$500,000"
              const multiplier = cleaned.includes('+') ? 1 : (cleaned.includes('-') ? -1 : 1);
              return Math.abs(parseFloat(cleaned.replace(/[+-]/g, ''))) * multiplier || null;
            };
            
            const transactionDate = parseDate(filingDateText);
            const tradeDate = parseDate(tradeDateText) || transactionDate;
            const lastPrice = parsePrice(priceText);
            const valueNumeric = parseValue(valueText);
            
            if (ticker && companyName && ownerName && transactionDate) {
              results.push({
                transactionDate: transactionDate.toISOString(),
                tradeDate: tradeDate.toISOString(),
                ticker: ticker,
                companyName: companyName,
                ownerName: ownerName,
                title: title,
                transactionType: transactionType,
                lastPrice: lastPrice,
                quantity: quantity,
                sharesHeld: sharesHeld,
                owned: owned,
                value: valueText,
                valueNumeric: valueNumeric,
              });
            }
          } catch (error) {
            console.error(`Error parsing row ${index}:`, error);
          }
        }
      });
      
      return results;
    }, tableSelector);
    
    console.log(`\n📊 Found ${trades.length} trades (TEST MODE - NO IMPORT)`);
    
    if (trades.length === 0) {
      console.log('\n⚠️  No trades extracted. Checking page structure...');
      const pageText = await page.evaluate(() => document.body.innerText);
      console.log('\nPage text sample (first 500 chars):');
      console.log(pageText.substring(0, 500));
      return;
    }
    
    // Show first few trades (TEST ONLY)
    console.log('\n📋 Sample trades found:');
    trades.slice(0, 10).forEach((trade, i) => {
      console.log(`\n${i + 1}. ${trade.ticker} - ${trade.companyName}`);
      console.log(`   Owner: ${trade.ownerName} (${trade.title})`);
      console.log(`   Date: ${new Date(trade.transactionDate).toLocaleDateString()}`);
      console.log(`   Type: ${trade.transactionType}`);
      console.log(`   Value: ${trade.value}`);
    });
    
    // Check for the NVCT trade
    const nvctTrade = trades.find(t => t.ticker === 'NVCT');
    if (nvctTrade) {
      console.log('\n✅ Found NVCT trade!');
      console.log(JSON.stringify(nvctTrade, null, 2));
    } else {
      console.log('\n⚠️  NVCT trade not found in first page results');
    }
    
    console.log('\n✅ TEST COMPLETE - Scraper successfully bypassed blocking!');
    console.log(`   Total trades extracted: ${trades.length}`);
    console.log('   (This was a test - no data was imported to database)');
    console.log('\n⏳ Keeping browser open for 10 seconds so you can verify results...');
    console.log('   (Browser will close automatically)');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ Scraping failed:', error);
    console.log('\n⏳ Keeping browser open for 30 seconds for debugging...');
    await page.waitForTimeout(30000);
    throw error;
  } finally {
    console.log('\n🔒 Closing browser...');
    await browser.close();
  }
}

// Run if called directly
if (require.main === module) {
  scrapeOpenInsiderLatest()
    .then(() => {
      console.log('\n✅ Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Error:', error);
      process.exit(1);
    });
}

module.exports = { scrapeOpenInsiderLatest };
