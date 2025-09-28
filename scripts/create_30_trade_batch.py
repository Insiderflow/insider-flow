#!/usr/bin/env python3
import re

def create_30_trade_batch():
    # Read the first 1000-trade batch
    with open('trades_1000_batch_1.sql', 'r') as f:
        content = f.read()
    
    # The file contains just the VALUES part, so we need to add the INSERT statement
    # Split by ),( to get individual trade entries
    values_string = content
    
    # Split by ),( to get individual trade entries
    trade_entries = values_string.split('),(')
    
    print(f'Total trade entries found: {len(trade_entries)}')
    
    # Take only first 30 entries
    first_30 = trade_entries[:30]
    
    # Clean up entries
    cleaned_entries = []
    for entry in first_30:
        clean_entry = entry.strip()
        if clean_entry.startswith('('):
            clean_entry = clean_entry[1:]  # Remove leading (
        if clean_entry.endswith(')'):
            clean_entry = clean_entry[:-1]  # Remove trailing )
        cleaned_entries.append(f"({clean_entry})")
    
    # Create SQL for this batch
    sql = f'INSERT INTO "Trade" ("id", "politician_id", "issuer_id", "traded_at", "type", "size_min", "size_max", "published_at", "filed_after_days", "owner", "price", "source_url", "raw", "created_at") VALUES\n{",\\n".join(cleaned_entries)}\nON CONFLICT (id) DO NOTHING;'
    
    # Write to file
    filename = 'trades_30_batch_1.sql'
    with open(filename, 'w') as f:
        f.write(sql)
    
    print(f'Created {filename} with {len(cleaned_entries)} trades')
    
    # Show first few characters to verify
    print(f'First 100 characters: {sql[:100]}...')

if __name__ == "__main__":
    create_30_trade_batch()
