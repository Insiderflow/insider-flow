#!/usr/bin/env python3
import re
import math
import os

def create_45_trade_batches():
    # Read the all_trades.sql file
    trades_file_path = 'web/all_trades.sql'
    with open(trades_file_path, 'r') as f:
        content = f.read()

    # Extract all trade entries using regex
    # This regex captures the entire VALUES clause for each trade
    entry_pattern = r'\(([^)]*?)\)(?:,\n|\nON CONFLICT \(id\) DO NOTHING;)'
    entries = re.findall(entry_pattern, content)

    # Filter out the initial INSERT statement line
    trade_entries = [e for e in entries if not e.startswith('INSERT INTO')]

    print(f'Total trade entries found: {len(trade_entries)}')

    # Check for duplicates by trade ID
    trade_ids = []
    duplicates = []
    
    for entry in trade_entries:
        # Extract trade ID (first field in each entry)
        trade_id = entry.split(',')[0].strip().replace("'", "")
        if trade_id in trade_ids:
            duplicates.append(trade_id)
        else:
            trade_ids.append(trade_id)
    
    print(f'Unique trade IDs: {len(trade_ids)}')
    print(f'Duplicate trade IDs found: {len(duplicates)}')
    
    if duplicates:
        print(f'First 10 duplicate IDs: {duplicates[:10]}')
        print('⚠️  WARNING: Duplicates found in source data!')
    else:
        print('✅ No duplicates found in source data!')

    # Create batches of 45 trades each
    batch_size = 45
    total_batches = math.ceil(len(trade_entries) / batch_size)

    print(f'\nCreating {total_batches} batches of {batch_size} trades each')

    # Create output directory if it doesn't exist
    output_dir = 'web/trades_45_batches'
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    for batch_num in range(total_batches):
        start_idx = batch_num * batch_size
        end_idx = min(start_idx + batch_size, len(trade_entries))
        batch_entries = trade_entries[start_idx:end_idx]

        # Create SQL for this batch
        sql_parts = []
        for entry in batch_entries:
            sql_parts.append(f"({entry})")

        sql = f'INSERT INTO "Trade" ("id", "politician_id", "issuer_id", "traded_at", "type", "size_min", "size_max", "published_at", "filed_after_days", "owner", "price", "source_url", "raw", "created_at") VALUES\n{",\\n".join(sql_parts)}\nON CONFLICT (id) DO NOTHING;'

        # Write to file
        filename = f'{output_dir}/trades_45_batch_{batch_num + 1:03d}.sql'
        with open(filename, 'w') as f:
            f.write(sql)

        print(f'Created {filename} with {len(batch_entries)} trades')
        
        # Extract first and last trade IDs for logging
        first_trade_id = batch_entries[0].split(',')[0].strip().replace("'", "")
        last_trade_id = batch_entries[-1].split(',')[0].strip().replace("'", "")
        print(f'  Trades {start_idx + 1}-{end_idx}: {first_trade_id} to {last_trade_id}')

    print(f'\n✅ Created {total_batches} batches of up to {batch_size} trades each!')
    print(f'📁 Output directory: {output_dir}')
    
    # Final verification
    print(f'\n📊 Final Statistics:')
    print(f'  Total trades: {len(trade_entries)}')
    print(f'  Unique trades: {len(trade_ids)}')
    print(f'  Duplicates: {len(duplicates)}')
    print(f'  Total batches: {total_batches}')
    print(f'  Batch size: {batch_size}')

if __name__ == '__main__':
    create_45_trade_batches()
