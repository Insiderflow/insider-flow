#!/usr/bin/env python3
import re

def extract_first_20_trades():
    # Read the first 1000-trade batch
    with open('trades_1000_batch_1.sql', 'r') as f:
        content = f.read()
    
    # Find the VALUES section
    values_match = re.search(r'VALUES\s*\((.*)\);', content, re.DOTALL)
    if not values_match:
        print("Could not find VALUES in SQL file")
        return
    
    values_string = values_match[1]
    
    # Split by ),( to get individual trade entries
    trade_entries = values_string.split('),(')
    
    print(f'Total trade entries found: {len(trade_entries)}')
    
    # Take only first 20 entries
    first_20 = trade_entries[:20]
    
    # Clean up entries
    cleaned_entries = []
    for entry in first_20:
        clean_entry = entry.strip()
        if clean_entry.startswith('('):
            clean_entry = clean_entry[1:]
        if clean_entry.endswith(')'):
            clean_entry = clean_entry[:-1]
        cleaned_entries.append(clean_entry)
    
    # Create SQL for first 20 trades
    sql_parts = []
    for entry in cleaned_entries:
        sql_parts.append(f"({entry})")
    
    sql = f"""INSERT INTO "Trade" ("id", "politician_id", "issuer_id", "traded_at", "type", "size_min", "size_max", "published_at", "filed_after_days", "owner", "price", "source_url", "raw", "created_at") VALUES
{",\\n".join(sql_parts)}
ON CONFLICT (id) DO NOTHING;"""
    
    # Write to file
    filename = 'trades_first_20.sql'
    with open(filename, 'w') as f:
        f.write(sql)
    
    print(f'Created {filename} with {len(cleaned_entries)} trades')
    print('✅ First 20 trades extracted successfully!')

if __name__ == '__main__':
    extract_first_20_trades()
