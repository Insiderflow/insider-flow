#!/usr/bin/env python3
import re
import os

def create_missing_issuer_sql(issuer_id, issuer_name):
    """Create SQL to insert a missing issuer"""
    # Escape single quotes in issuer name
    safe_name = issuer_name.replace("'", "''")
    return f"INSERT INTO \"Issuer\" (\"id\", \"name\", \"ticker\") VALUES ('{issuer_id}', '{safe_name}', NULL) ON CONFLICT (id) DO NOTHING;"

def extract_issuer_name_from_raw(raw_json):
    """Extract issuer name from the raw JSON field"""
    if '"issuerName":"' in raw_json:
        start = raw_json.find('"issuerName":"') + len('"issuerName":"')
        end = raw_json.find('"', start)
        if end > start:
            return raw_json[start:end]
    return "Unknown Issuer"

def process_trade_batch(batch_file_path):
    """Process a single trade batch file and generate SQL for missing issuers and trades"""
    
    with open(batch_file_path, 'r') as f:
        content = f.read()
    
    # Extract trade entries - handle the fact that the file is on one line with \n characters
    # First, normalize the content by replacing literal \n with actual newlines
    normalized_content = content.replace('\\n', '\n')
    
    # Now extract trade entries
    trade_pattern = r"\(([^)]*?)\)(?:,\n|\nON CONFLICT \(id\) DO NOTHING;)"
    trades = re.findall(trade_pattern, normalized_content)
    
    # Filter out INSERT statements
    valid_trades = [t for t in trades if not t.startswith('INSERT INTO')]
    
    print(f"Processing {len(valid_trades)} trades from {os.path.basename(batch_file_path)}")
    
    # Track unique issuers we need to create
    issuers_to_create = {}
    trades_to_import = []
    
    for trade in valid_trades:
        try:
            parts = trade.split(',')
            if len(parts) >= 14:
                trade_id = parts[0].strip().replace("'", "")
                politician_id = parts[1].strip().replace("'", "")
                issuer_id = parts[2].strip().replace("'", "")
                
                # Extract issuer name from raw JSON
                raw_json = parts[-2].strip()
                issuer_name = extract_issuer_name_from_raw(raw_json)
                
                # Track this issuer for creation
                issuers_to_create[issuer_id] = issuer_name
                
                # Store trade for import
                trades_to_import.append(trade)
                
        except Exception as e:
            print(f"Error processing trade: {e}")
            continue
    
    # Generate SQL for missing issuers
    issuer_sql = []
    for issuer_id, issuer_name in issuers_to_create.items():
        issuer_sql.append(create_missing_issuer_sql(issuer_id, issuer_name))
    
    # Generate SQL for trades
    if trades_to_import:
        trade_sql = f'INSERT INTO "Trade" ("id", "politician_id", "issuer_id", "traded_at", "type", "size_min", "size_max", "published_at", "filed_after_days", "owner", "price", "source_url", "raw", "created_at") VALUES\n{",\\n".join([f"({t})" for t in trades_to_import])}\nON CONFLICT (id) DO NOTHING;'
    else:
        trade_sql = ""
    
    return issuer_sql, trade_sql

def main():
    """Process the first few trade batches and generate SQL"""
    
    batch_dir = 'web/trades_45_batches'
    if not os.path.exists(batch_dir):
        print(f"❌ Batch directory {batch_dir} not found!")
        return
    
    # Process first 3 batches
    batch_files = sorted([f for f in os.listdir(batch_dir) if f.endswith('.sql')])[:3]
    
    all_issuer_sql = []
    all_trade_sql = []
    
    for batch_file in batch_files:
        batch_path = os.path.join(batch_dir, batch_file)
        print(f"\n🔄 Processing {batch_file}")
        
        issuer_sql, trade_sql = process_trade_batch(batch_path)
        
        all_issuer_sql.extend(issuer_sql)
        if trade_sql:
            all_trade_sql.append(trade_sql)
    
    # Write combined SQL
    output_file = 'web/combined_import.sql'
    with open(output_file, 'w') as f:
        f.write("-- Missing Issuers\n")
        f.write("\n".join(all_issuer_sql))
        f.write("\n\n-- Trades\n")
        f.write("\n".join(all_trade_sql))
    
    print(f"\n✅ Generated combined SQL file: {output_file}")
    print(f"📊 Created {len(all_issuer_sql)} issuer insertions")
    print(f"📊 Created {len(all_trade_sql)} trade insertions")

if __name__ == '__main__':
    main()
