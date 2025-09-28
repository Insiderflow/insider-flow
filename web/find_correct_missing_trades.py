#!/usr/bin/env python3
"""
Correct analysis to find the 27,785 missing trades
Local SQL: 35,808 trades (complete dataset)
Neon DB: 8,023 trades (current database)
Missing: 27,785 trades
"""
import re

def find_correct_missing_trades():
    print("🔍 CORRECT MISSING TRADES ANALYSIS")
    print("=" * 50)
    
    # Step 1: Extract trade IDs from CSV (Neon database)
    print("📊 Step 1: Extracting trade IDs from Neon database (CSV)...")
    with open('trade.csv', 'r') as f:
        csv_lines = f.readlines()
    
    csv_trade_ids = set()
    for line in csv_lines[1:]:  # Skip header
        trade_id = line.split(',')[0].strip().replace('"', '')
        csv_trade_ids.add(trade_id)
    
    print(f"✅ Neon Database (CSV): {len(csv_trade_ids)} trades")
    
    # Step 2: Extract trade IDs from local SQL file
    print("📊 Step 2: Extracting trade IDs from local SQL file...")
    with open('all_trades.sql', 'r') as f:
        sql_content = f.read()
    
    # Extract all trade IDs from SQL using regex
    trade_id_pattern = r"'([0-9]{11})'"
    sql_trade_ids = set(re.findall(trade_id_pattern, sql_content))
    
    print(f"✅ Local SQL file: {len(sql_trade_ids)} trades")
    
    # Step 3: Find missing trade IDs
    print("📊 Step 3: Finding missing trade IDs...")
    missing_trade_ids = sql_trade_ids - csv_trade_ids
    
    print(f"✅ Missing Trade IDs: {len(missing_trade_ids)} trades")
    
    # Step 4: Analyze the missing trade ID ranges
    print("📊 Step 4: Analyzing missing trade ID ranges...")
    missing_list = sorted(list(missing_trade_ids))
    
    if missing_list:
        print(f"First 10 missing IDs: {missing_list[:10]}")
        print(f"Last 10 missing IDs: {missing_list[-10:]}")
        
        # Group by ID patterns
        patterns = {}
        for trade_id in missing_list:
            if trade_id.startswith('1000006'):
                pattern = '1000006xxxx'
            elif trade_id.startswith('2000379'):
                pattern = '2000379xxxx'
            elif trade_id.startswith('2000378'):
                pattern = '2000378xxxx'
            elif trade_id.startswith('2000377'):
                pattern = '2000377xxxx'
            elif trade_id.startswith('2000376'):
                pattern = '2000376xxxx'
            elif trade_id.startswith('2000375'):
                pattern = '2000375xxxx'
            else:
                pattern = 'other'
            
            if pattern not in patterns:
                patterns[pattern] = []
            patterns[pattern].append(trade_id)
        
        print("\n📈 Missing Trade ID Patterns:")
        for pattern, ids in patterns.items():
            print(f"  {pattern}: {len(ids)} trades")
    
    # Step 5: Save missing trade IDs to file
    print("📊 Step 5: Saving missing trade IDs...")
    with open('correct_missing_trade_ids.txt', 'w') as f:
        for trade_id in sorted(missing_list):
            f.write(f"{trade_id}\n")
    
    print(f"✅ Saved {len(missing_list)} missing trade IDs to 'correct_missing_trade_ids.txt'")
    
    # Step 6: Summary
    print("\n📋 CORRECT SUMMARY:")
    print(f"  Neon Database (CSV): {len(csv_trade_ids)} trades")
    print(f"  Local SQL file: {len(sql_trade_ids)} trades")
    print(f"  Missing: {len(missing_trade_ids)} trades")
    print(f"  Expected after import: {len(csv_trade_ids) + len(missing_trade_ids)} trades")
    
    return missing_list

if __name__ == '__main__':
    missing_trades = find_correct_missing_trades()
    print(f"\n🎯 Found {len(missing_trades)} missing trades that need to be imported!")
