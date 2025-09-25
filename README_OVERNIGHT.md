# Overnight Capitol Trades Scraping

This setup allows you to run continuous data scraping from Capitol Trades throughout the night.

## Quick Start

1. **Start the overnight scraper:**
   ```bash
   npm run overnight:start
   ```

2. **Monitor progress:**
   ```bash
   npm run monitor
   ```

3. **View live logs:**
   ```bash
   npm run logs
   ```

4. **Stop the scraper:**
   ```bash
   pkill -f overnight_scraper
   ```

## What It Does

The overnight scraper will:

- **Scrape 2,984 pages of trades data** (35,808 total trades)
- **Scrape 19 pages of politicians** (217 politicians with profile images) 
- **Scrape 268 pages of issuers** (3,211 issuers)
- **Automatically upsert data** to PostgreSQL database
- **Handle errors gracefully** with automatic retries
- **Log everything** with timestamps
- **Respect rate limits** (3-5 second delays between requests)

## Expected Timeline

- **Politicians (19 pages)**: ~15-20 minutes
- **Issuers (268 pages)**: ~3-4 hours  
- **Trades (2,984 pages)**: ~25-30 hours
- **Total estimated time**: 28-35 hours (overnight + next day)

## Monitoring

### Check Status
```bash
npm run status
```

### View Live Logs
```bash
npm run logs
```

### Database Counts
```bash
cd web && npx prisma studio
```

## Error Handling

The scraper includes robust error handling:

- **Automatic retries** on failed requests
- **Browser restart** if too many errors occur
- **Graceful degradation** - continues even if some pages fail
- **Detailed logging** of all errors and progress

## Data Structure

### Trades
- Politician info (name, chamber)
- Issuer info (name, ticker)
- Trade details (date, type, size, price)
- Filing information

### Politicians  
- Name, party, chamber, state
- Linked to all their trades

### Issuers
- Name, ticker, sector, country
- Linked to all trades involving them

## Cleanup

After scraping is complete, run cleanup:

```bash
./scripts/cleanup.sh
```

This will:
- Remove old log files
- Optimize database performance
- Show final data counts

## Troubleshooting

### If scraper stops unexpectedly:
```bash
# Check what's running
npm run status

# Restart if needed
npm run overnight:start
```

### If database connection fails:
```bash
# Check database
cd web && npx prisma db push --accept-data-loss
```

### If you need to stop everything:
```bash
pkill -f overnight_scraper
pkill -f "next dev"
```

## Expected Results

After a full run, you should have:
- **35,808 trades** from 2,984 pages
- **217 politicians** from 19 pages (with profile images)
- **3,211 issuers** from 268 pages
- **Complete relational data** ready for the web app

The web application will automatically display this data with filtering, sorting, and search capabilities.
