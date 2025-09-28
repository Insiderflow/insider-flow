#!/usr/bin/env python3
import re
import os

def filter_valid_trades():
    # First, get all existing issuer IDs from the database
    # We'll need to check this against our issuer data
    print("Getting existing issuer IDs...")
    
    # Read the issuer data to get valid issuer IDs
    with open('web/all_issuers.sql', 'r') as f:
        issuer_content = f.read()
    
    # Extract issuer IDs from the issuer data
    issuer_pattern = r"INSERT INTO \"Issuer\".*?VALUES\s*(.*?);"
    issuer_match = re.search(issuer_pattern, issuer_content, re.DOTALL)
    
    if not issuer_match:
        print("Could not find issuer data")
        return
    
    issuer_values = issuer_match[1]
    issuer_ids = set()
    
    # Extract issuer IDs from the VALUES clause
    for line in issuer_values.split('\n'):
        if line.strip().startswith('('):
            # Extract the ID (first field)
            id_match = re.search(r"\('([^']+)'", line)
            if id_match:
                issuer_ids.add(id_match.group(1))
    
    print(f"Found {len(issuer_ids)} valid issuer IDs")
    
    # Now process trade batches
    batch_dir = 'web/trades_45_batches'
    output_dir = 'web/trades_45_batches_filtered'
    
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    valid_batches = 0
    total_trades = 0
    valid_trades = 0
    
    for filename in sorted(os.listdir(batch_dir)):
        if filename.endswith('.sql'):
            print(f"Processing {filename}...")
            
            with open(os.path.join(batch_dir, filename), 'r') as f:
                content = f.read()
            
            # Extract trade entries
            trade_pattern = r"\(([^)]*?)\)(?:,\n|\nON CONFLICT \(id\) DO NOTHING;)"
            trades = re.findall(trade_pattern, content)
            
            valid_trades_in_batch = []
            
            for trade in trades:
                if not trade.startswith('INSERT INTO'):
                    # Extract issuer ID (third field)
                    parts = trade.split(',')
                    if len(parts) >= 3:
                        issuer_id = parts[2].strip().replace("'", "")
                        if issuer_id in issuer_ids:
                            valid_trades_in_batch.append(trade)
                            valid_trades += 1
                        else:
                            print(f"  Skipping trade with invalid issuer ID: {issuer_id}")
            
            if valid_trades_in_batch:
                # Create filtered batch
                sql_parts = []
                for trade in valid_trades_in_batch:
                    sql_parts.append(f"({trade})")
                
                sql = f'INSERT INTO "Trade" ("id", "politician_id", "issuer_id", "traded_at", "type", "size_min", "size_max", "published_at", "filed_after_days", "owner", "price", "source_url", "raw", "created_at") VALUES\n{",\\n".join(sql_parts)}\nON CONFLICT (id) DO NOTHING;'
                
                output_filename = filename.replace('.sql', '_filtered.sql')
                with open(os.path.join(output_dir, output_filename), 'w') as f:
                    f.write(sql)
                
                valid_batches += 1
                print(f"  Created {output_filename} with {len(valid_trades_in_batch)} valid trades")
            
            total_trades += len(trades)
    
    print(f"\n✅ Filtering complete!")
    print(f"  Total trades processed: {total_trades}")
    print(f"  Valid trades: {valid_trades}")
    print(f"  Valid batches created: {valid_batches}")
    print(f"  Output directory: {output_dir}")

if __name__ == '__main__':
    filter_valid_trades()
