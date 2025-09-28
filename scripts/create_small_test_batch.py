#!/usr/bin/env python3
import re

def create_small_test_batch():
    # Read the all_trades.sql file
    with open('all_trades.sql', 'r') as f:
        content = f.read()
    
    # Extract first 10 trade entries for testing
    entry_pattern = r"\('([^']+)', '([^']+)', '([^']+)', '([^']+)', '([^']+)', ([^,]+), ([^,]+), '([^']*)', ([^,]+), '([^']*)', ([^,]+), '([^']*)', '([^']*)', '([^']+)'\)"
    entries = re.findall(entry_pattern, content)
    
    print(f'Total trade entries found: {len(entries)}')
    print(f'Creating test batch with first 10 trades')
    
    # Take only first 10 entries
    test_entries = entries[:10]
    
    # Create SQL for test batch
    sql_parts = []
    for entry in test_entries:
        # Unpack the entry
        (id_val, politician_id, issuer_id, traded_at, type_val, 
         size_min, size_max, published_at, filed_after_days, 
         owner, price, source_url, raw, created_at) = entry
        
        # Handle NULL values and escape quotes
        size_min_val = size_min if size_min != 'NULL' else 'NULL'
        size_max_val = size_max if size_max != 'NULL' else 'NULL'
        published_at_val = f"'{published_at}'" if published_at else 'NULL'
        filed_after_days_val = filed_after_days if filed_after_days != 'NULL' else 'NULL'
        owner_val = f"'{owner}'" if owner else 'NULL'
        price_val = price if price != 'NULL' else 'NULL'
        source_url_val = f"'{source_url}'" if source_url else 'NULL'
        raw_val = f"'{raw}'" if raw else "'{}'"
        
        sql_parts.append(f"('{id_val}', '{politician_id}', '{issuer_id}', '{traded_at}', '{type_val}', {size_min_val}, {size_max_val}, {published_at_val}, {filed_after_days_val}, {owner_val}, {price_val}, {source_url_val}, {raw_val}, '{created_at}')")
    
    sql = f"""INSERT INTO "Trade" ("id", "politician_id", "issuer_id", "traded_at", "type", "size_min", "size_max", "published_at", "filed_after_days", "owner", "price", "source_url", "raw", "created_at") VALUES
{",\\n".join(sql_parts)}
ON CONFLICT (id) DO NOTHING;"""
    
    # Write to file
    filename = 'trades_test_10.sql'
    with open(filename, 'w') as f:
        f.write(sql)
    
    print(f'Created {filename} with {len(test_entries)} trades')
    print(f'  Test trades: {test_entries[0][0]} to {test_entries[-1][0]}')
    print('\\n✅ Test batch created!')

if __name__ == '__main__':
    create_small_test_batch()
