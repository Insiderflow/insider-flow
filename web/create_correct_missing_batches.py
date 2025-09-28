#!/usr/bin/env python3
"""
Create 45-trade batches for the 27,785 missing trades
"""
import os
import math
import re

def create_correct_missing_batches():
    print("🔧 CREATING 45-TRADE BATCHES FOR 27,785 MISSING TRADES")
    print("=" * 60)
    
    # Read the correct missing trade IDs
    with open('correct_27785_missing_trade_ids.txt', 'r') as f:
        missing_ids = set([line.strip() for line in f.readlines()])
    
    print(f"✅ Missing trade IDs to process: {len(missing_ids)}")
    
    # Read the local SQL file to extract trade entries
    with open('all_trades.sql', 'r') as f:
        sql_content = f.read()
    
    # Extract all trade entries from SQL
    entry_pattern = r'\(([^)]*?)\)(?:,\n|\nON CONFLICT \(id\) DO NOTHING;)'
    entries = re.findall(entry_pattern, sql_content)
    
    # Filter out INSERT statements
    trade_entries = [e for e in entries if not e.startswith('INSERT INTO')]
    
    print(f"✅ Total trade entries in SQL: {len(trade_entries)}")
    
    # Filter trades that are in the missing list
    missing_trades = []
    for trade in trade_entries:
        # Extract trade ID (first field)
        trade_id = trade.split(',')[0].strip().replace("'", "")
        if trade_id in missing_ids:
            missing_trades.append(trade)
    
    print(f"✅ Missing trades found: {len(missing_trades)}")
    
    # Create batches of 45 trades each
    batch_size = 45
    total_batches = math.ceil(len(missing_trades) / batch_size)
    
    print(f"✅ Creating {total_batches} batches of {batch_size} trades each")
    
    # Create output directory
    output_dir = 'missing_trades_45_batches'
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    for batch_num in range(total_batches):
        start_idx = batch_num * batch_size
        end_idx = min(start_idx + batch_size, len(missing_trades))
        batch_trades = missing_trades[start_idx:end_idx]
        
        # Create SQL for this batch
        sql_parts = []
        for trade in batch_trades:
            sql_parts.append(f"({trade})")
        
        sql = f"""INSERT INTO "Trade" ("id", "politician_id", "issuer_id", "traded_at", "type", "size_min", "size_max", "published_at", "filed_after_days", "owner", "price", "source_url", "raw", "created_at") VALUES
    {",\\n".join(sql_parts)}
    ON CONFLICT (id) DO NOTHING;"""
        
        # Write to file
        filename = f'{output_dir}/missing_trades_45_batch_{batch_num + 1:03d}.sql'
        with open(filename, 'w') as f:
            f.write(sql)
        
        print(f"✅ Created {filename} with {len(batch_trades)} trades")
        
        # Extract first and last trade IDs for logging
        if batch_trades:
            first_trade_id = batch_trades[0].split(',')[0].strip().replace("'", "")
            last_trade_id = batch_trades[-1].split(',')[0].strip().replace("'", "")
            print(f"   Trades {start_idx + 1}-{end_idx}: {first_trade_id} to {last_trade_id}")
    
    print(f"\n🎯 SUCCESS!")
    print(f"✅ Created {total_batches} batches of missing trades!")
    print(f"✅ Total missing trades: {len(missing_trades)}")
    print(f"✅ Expected total trades after import: {8023 + len(missing_trades)}")
    print(f"✅ Output directory: {output_dir}/")

if __name__ == '__main__':
    create_correct_missing_batches()
