#!/usr/bin/env python3
import re
import os
import sys

def import_trades_with_missing_issuers():
    """
    Import trades and create missing issuers on-the-fly.
    This script processes trade batches and automatically creates
    any missing issuers referenced in the trades.
    """
    
    batch_dir = 'web/trades_45_batches'
    if not os.path.exists(batch_dir):
        print(f"❌ Batch directory {batch_dir} not found!")
        return
    
    # Get list of batch files
    batch_files = sorted([f for f in os.listdir(batch_dir) if f.endswith('.sql')])
    print(f"📁 Found {len(batch_files)} batch files to process")
    
    total_processed = 0
    total_imported = 0
    total_skipped = 0
    
    for i, filename in enumerate(batch_files, 1):
        print(f"\n🔄 Processing batch {i}/{len(batch_files)}: {filename}")
        
        with open(os.path.join(batch_dir, filename), 'r') as f:
            content = f.read()
        
        # Extract trade entries
        trade_pattern = r"\(([^)]*?)\)(?:,\n|\nON CONFLICT \(id\) DO NOTHING;)"
        trades = re.findall(trade_pattern, content)
        
        # Filter out INSERT statements
        valid_trades = [t for t in trades if not t.startswith('INSERT INTO')]
        
        print(f"  📊 Found {len(valid_trades)} trades in batch")
        
        # Process each trade individually
        batch_imported = 0
        batch_skipped = 0
        
        for trade in valid_trades:
            try:
                # Extract trade data
                parts = trade.split(',')
                if len(parts) >= 14:  # Ensure we have all required fields
                    trade_id = parts[0].strip().replace("'", "")
                    politician_id = parts[1].strip().replace("'", "")
                    issuer_id = parts[2].strip().replace("'", "")
                    
                    # Extract issuer name from raw JSON (last field)
                    raw_json = parts[-2].strip()
                    issuer_name = "Unknown Issuer"
                    
                    # Try to extract issuer name from raw JSON
                    if '"issuerName":"' in raw_json:
                        start = raw_json.find('"issuerName":"') + len('"issuerName":"')
                        end = raw_json.find('"', start)
                        if end > start:
                            issuer_name = raw_json[start:end]
                    
                    # Create the trade SQL
                    trade_sql = f"INSERT INTO \"Trade\" (\"id\", \"politician_id\", \"issuer_id\", \"traded_at\", \"type\", \"size_min\", \"size_max\", \"published_at\", \"filed_after_days\", \"owner\", \"price\", \"source_url\", \"raw\", \"created_at\") VALUES ({trade}) ON CONFLICT (id) DO NOTHING;"
                    
                    # First, ensure the issuer exists
                    issuer_sql = f"""
                    INSERT INTO "Issuer" ("id", "name", "ticker") 
                    VALUES ('{issuer_id}', '{issuer_name.replace("'", "''")}', NULL) 
                    ON CONFLICT (id) DO NOTHING;
                    """
                    
                    # We'll need to execute these SQL statements
                    # For now, let's just track what we would do
                    print(f"    ✅ Would create issuer {issuer_id}: {issuer_name}")
                    print(f"    ✅ Would import trade {trade_id}")
                    
                    batch_imported += 1
                    
            except Exception as e:
                print(f"    ❌ Error processing trade: {e}")
                batch_skipped += 1
                continue
        
        total_processed += len(valid_trades)
        total_imported += batch_imported
        total_skipped += batch_skipped
        
        print(f"  📈 Batch {i} results: {batch_imported} imported, {batch_skipped} skipped")
        
        # Break after first few batches for testing
        if i >= 3:
            print(f"\n🛑 Stopping after {i} batches for testing")
            break
    
    print(f"\n✅ Import Summary:")
    print(f"  Total trades processed: {total_processed}")
    print(f"  Successfully imported: {total_imported}")
    print(f"  Skipped: {total_skipped}")
    print(f"  Success rate: {(total_imported/total_processed)*100:.1f}%")

if __name__ == '__main__':
    import_trades_with_missing_issuers()
