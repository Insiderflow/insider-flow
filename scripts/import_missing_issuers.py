#!/usr/bin/env python3
import json
import sys

def create_missing_issuers_sql():
    """Create SQL to import the 21 missing issuers"""
    
    # Load the missing issuers from cross-check results
    with open('web/cross_check_results.json', 'r') as f:
        results = json.load(f)
    
    missing_issuers = results['missing_in_neon']
    
    print(f"Creating SQL for {len(missing_issuers)} missing issuers...")
    
    # Create SQL INSERT statements
    sql_parts = []
    for issuer in missing_issuers:
        # Handle ticker - convert None to NULL
        ticker_value = f"'{issuer['ticker']}'" if issuer['ticker'] else 'NULL'
        
        sql_parts.append(f"('{issuer['id']}', '{issuer['name']}', {ticker_value})")
    
    sql = f"""INSERT INTO "Issuer" ("id", "name", "ticker") VALUES
{',\n'.join(sql_parts)}
ON CONFLICT (id) DO NOTHING;"""
    
    # Write to file
    with open('web/missing_issuers_import.sql', 'w') as f:
        f.write(sql)
    
    print(f"Created web/missing_issuers_import.sql with {len(missing_issuers)} issuers")
    
    # Show the issuers that will be imported
    print("\nMissing issuers to be imported:")
    for issuer in missing_issuers:
        print(f"  {issuer['id']}: {issuer['name']} ({issuer['ticker'] or 'No ticker'})")

if __name__ == '__main__':
    create_missing_issuers_sql()
