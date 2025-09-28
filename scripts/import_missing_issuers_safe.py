#!/usr/bin/env python3
import json

def create_safe_missing_issuers_sql():
    """Create safe SQL to import the 21 missing issuers, handling apostrophes"""
    
    # Load the missing issuers from cross-check results
    with open('web/cross_check_results.json', 'r') as f:
        results = json.load(f)
    
    missing_issuers = results['missing_in_neon']
    
    print(f"Creating safe SQL for {len(missing_issuers)} missing issuers...")
    
    # Create individual SQL INSERT statements
    sql_statements = []
    for issuer in missing_issuers:
        # Handle ticker - convert None to NULL
        ticker_value = f"'{issuer['ticker']}'" if issuer['ticker'] else 'NULL'
        
        # Escape single quotes in names
        safe_name = issuer['name'].replace("'", "''")
        
        sql = f"INSERT INTO \"Issuer\" (\"id\", \"name\", \"ticker\") VALUES ('{issuer['id']}', '{safe_name}', {ticker_value}) ON CONFLICT (id) DO NOTHING;"
        sql_statements.append(sql)
    
    # Write to file
    with open('web/missing_issuers_safe.sql', 'w') as f:
        f.write('\n'.join(sql_statements))
    
    print(f"Created web/missing_issuers_safe.sql with {len(missing_issuers)} individual statements")
    
    # Show the issuers that will be imported
    print("\nMissing issuers to be imported:")
    for issuer in missing_issuers:
        print(f"  {issuer['id']}: {issuer['name']} ({issuer['ticker'] or 'No ticker'})")

if __name__ == '__main__':
    create_safe_missing_issuers_sql()
