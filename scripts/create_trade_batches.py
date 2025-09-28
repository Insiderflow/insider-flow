#!/usr/bin/env python3
import re

def create_trade_batches():
    # Read the all_trades.sql file
    with open('all_trades.sql', 'r') as f:
        content = f.read()
    
    # Extract all trade entries using regex
    # Pattern to match each trade entry
    entry_pattern = r"\('([^']+)', '([^']+)', '([^']+)', '([^']+)', '([^']+)', ([^,]+), ([^,]+), '([^']*)', ([^,]+), '([^']*)', ([^,]+), '([^']*)', '([^']*)', '([^']+)'\)"
    entries = re.findall(entry_pattern, content)
    
    print(f'Total trade entries found: {len(entries)}')
    
    # Create batches of 1000 trades each
    batch_size = 1000
    total_batches = (len(entries) + batch_size - 1) // batch_size
    
    print(f'Creating {total_batches} batches of {batch_size} trades each')
    
    for batch_num in range(total_batches):
        start_idx = batch_num * batch_size
        end_idx = min(start_idx + batch_size, len(entries))
        batch_entries = entries[start_idx:end_idx]
        
        # Create SQL for this batch
        sql_parts = []
        for entry in batch_entries:
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
        filename = f'trades_1000_batch_{batch_num + 1}.sql'
        with open(filename, 'w') as f:
            f.write(sql)
        
        print(f'Created {filename} with {len(batch_entries)} trades')
        print(f'  Trades {start_idx + 1}-{end_idx}: {batch_entries[0][0]} to {batch_entries[-1][0]}')
    
    print(f'\\n✅ Created {total_batches} batches of up to {batch_size} trades each!')

if __name__ == '__main__':
    create_trade_batches()
