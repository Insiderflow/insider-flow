#!/usr/bin/env python3
import csv
import json
import sys

def load_neon_issuers(csv_file):
    """Load issuers from Neon CSV export"""
    neon_issuers = {}
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            neon_issuers[row['id']] = {
                'name': row['name'],
                'ticker': row['ticker'] if row['ticker'] != 'None' else None,
                'sector': row['sector'],
                'country': row['country']
            }
    return neon_issuers

def load_local_issuers(json_file):
    """Load issuers from local JSON file"""
    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
        # Convert list to dictionary if needed
        if isinstance(data, list):
            return {issuer['id']: issuer for issuer in data}
        return data

def cross_check_issuers(neon_issuers, local_issuers):
    """Cross-check Neon vs Local issuer data"""
    print(f"Neon issuers: {len(neon_issuers)}")
    print(f"Local issuers: {len(local_issuers)}")
    
    # Find issuers in local data but not in Neon
    missing_in_neon = []
    for issuer_id, issuer_data in local_issuers.items():
        if issuer_id not in neon_issuers:
            missing_in_neon.append({
                'id': issuer_id,
                'name': issuer_data.get('name', ''),
                'ticker': issuer_data.get('ticker', '')
            })
    
    # Find issuers in Neon but not in local data
    missing_in_local = []
    for issuer_id, issuer_data in neon_issuers.items():
        if issuer_id not in local_issuers:
            missing_in_local.append({
                'id': issuer_id,
                'name': issuer_data.get('name', ''),
                'ticker': issuer_data.get('ticker', '')
            })
    
    # Find common issuers with different data
    different_data = []
    for issuer_id in set(neon_issuers.keys()) & set(local_issuers.keys()):
        neon_issuer = neon_issuers[issuer_id]
        local_issuer = local_issuers[issuer_id]
        
        if (neon_issuer['name'] != local_issuer.get('name', '') or 
            neon_issuer['ticker'] != local_issuer.get('ticker', '')):
            different_data.append({
                'id': issuer_id,
                'neon_name': neon_issuer['name'],
                'local_name': local_issuer.get('name', ''),
                'neon_ticker': neon_issuer['ticker'],
                'local_ticker': local_issuer.get('ticker', '')
            })
    
    return missing_in_neon, missing_in_local, different_data

def main():
    neon_file = 'web/neonIssuer.csv'
    local_file = 'web/issuers.json'
    
    print("Loading Neon issuer data...")
    neon_issuers = load_neon_issuers(neon_file)
    
    print("Loading local issuer data...")
    local_issuers = load_local_issuers(local_file)
    
    print("Cross-checking data...")
    missing_in_neon, missing_in_local, different_data = cross_check_issuers(neon_issuers, local_issuers)
    
    print(f"\n=== CROSS-CHECK RESULTS ===")
    print(f"Missing in Neon: {len(missing_in_neon)}")
    print(f"Missing in Local: {len(missing_in_local)}")
    print(f"Different data: {len(different_data)}")
    
    if missing_in_neon:
        print(f"\n=== ISSUERS MISSING IN NEON ({len(missing_in_neon)}) ===")
        for issuer in missing_in_neon[:10]:  # Show first 10
            print(f"ID: {issuer['id']}, Name: {issuer['name']}, Ticker: {issuer['ticker']}")
        if len(missing_in_neon) > 10:
            print(f"... and {len(missing_in_neon) - 10} more")
    
    if missing_in_local:
        print(f"\n=== ISSUERS MISSING IN LOCAL ({len(missing_in_local)}) ===")
        for issuer in missing_in_local[:10]:  # Show first 10
            print(f"ID: {issuer['id']}, Name: {issuer['name']}, Ticker: {issuer['ticker']}")
        if len(missing_in_local) > 10:
            print(f"... and {len(missing_in_local) - 10} more")
    
    if different_data:
        print(f"\n=== ISSUERS WITH DIFFERENT DATA ({len(different_data)}) ===")
        for issuer in different_data[:10]:  # Show first 10
            print(f"ID: {issuer['id']}")
            print(f"  Neon: {issuer['neon_name']} ({issuer['neon_ticker']})")
            print(f"  Local: {issuer['local_name']} ({issuer['local_ticker']})")
            print()
        if len(different_data) > 10:
            print(f"... and {len(different_data) - 10} more")
    
    # Save detailed results
    with open('web/cross_check_results.json', 'w') as f:
        json.dump({
            'missing_in_neon': missing_in_neon,
            'missing_in_local': missing_in_local,
            'different_data': different_data
        }, f, indent=2)
    
    print(f"\nDetailed results saved to web/cross_check_results.json")

if __name__ == '__main__':
    main()
