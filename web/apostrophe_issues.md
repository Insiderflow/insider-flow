# Apostrophe Issues in Data Import

## Known Issues
- Some issuer names contain apostrophes that cause SQL syntax errors
- These need to be escaped with double apostrophes ('')

## Examples of Problematic Names
- O'Halleran (needs to be O''Halleran)
- Other names with apostrophes in company names

## Solution
- Use ON CONFLICT DO NOTHING to skip duplicates
- Escape apostrophes in SQL strings
- Note problematic entries for later manual correction

## Status
- Importing 20 issuers per token
- Tracking apostrophe failures for manual review