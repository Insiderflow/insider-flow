#!/usr/bin/env python3
import re
import os

def create_smaller_batches():
    # Read the first 1000-trade batch
    with open('trades_1000_batch_1.sql', 'r') as f:
        content = f.read()
    
    # The file contains just the VALUES part, so we need to add the INSERT statement
    # Split by ),( to get individual trade entries
    trade_entries = content.split('),(')
    
    print(f'Total trade entries in batch 1: {len(trade_entries)}')
    
    # Create smaller batches of 20 trades each (to fit MCP tool limits)
    batch_size = 20
    total_small_batches = (len(trade_entries) + batch_size - 1) // batch_size
    
    print(f'Creating {total_small_batches} smaller batches of {batch_size} trades each')
    
    for batch_num in range(total_small_batches):
        start_idx = batch_num * batch_size
        end_idx = min(start_idx + batch_size, len(trade_entries))
        batch_entries = trade_entries[start_idx:end_idx]
        
        # Clean up entries
        cleaned_entries = []
        for entry in batch_entries:
            clean_entry = entry.strip()
            if clean_entry.startswith('('):
                clean_entry = clean_entry[1:]
            if clean_entry.endswith(')'):
                clean_entry = clean_entry[:-1]
            cleaned_entries.append(clean_entry)
        
        # Create SQL for this small batch
        sql_parts = []
        for entry in cleaned_entries:
            sql_parts.append(f"({entry})")
        
        sql = f"""INSERT INTO "Trade" ("id", "politician_id", "issuer_id", "traded_at", "type", "size_min", "size_max", "published_at", "filed_after_days", "owner", "price", "source_url", "raw", "created_at") VALUES
{",\\n".join(sql_parts)}
ON CONFLICT (id) DO NOTHING;"""
        
        # Write to file
        filename = f'trades_20_batch_{batch_num + 1}.sql'
        with open(filename, 'w') as f:
            f.write(sql)
        
        print(f'Created {filename} with {len(batch_entries)} trades')
        if batch_entries:
            # Extract first few characters of trade ID for identification
            first_id = batch_entries[0][:20] if batch_entries[0] else "unknown"
            last_id = batch_entries[-1][:20] if batch_entries[-1] else "unknown"
            print(f'  Trades {start_idx + 1}-{end_idx}: {first_id}... to {last_id}...')
    
    print(f'\\n✅ Created {total_small_batches} smaller batches of up to {batch_size} trades each!')

if __name__ == '__main__':
    create_smaller_batches()
