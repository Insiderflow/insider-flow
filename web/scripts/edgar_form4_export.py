#!/usr/bin/env python3
"""
Export SEC Form 4 insider transactions (via edgartools) to CSV for import_openinsider_filing_csv.js.

  pip install edgartools
  export EDGAR_IDENTITY="you@example.com"   # required by SEC

  python3 scripts/edgar_form4_export.py --days 90
  python3 scripts/edgar_form4_export.py --from 2025-11-01 --to 2026-05-16 -o data/edgar_form4.csv
  python3 scripts/edgar_form4_export.py --days 7 --max-filings 50 --dry-run

Output columns match openinsider_filing_day_csv.js / import_openinsider_filing_csv.js.
"""

from __future__ import annotations

import argparse
import csv
import os
import re
import sys
import time
from datetime import date, datetime, timedelta, timezone
from typing import Any, Iterator

try:
    from edgar import get_filings, set_identity
except ImportError:
    print("edgartools not installed. Run: pip install edgartools", file=sys.stderr)
    sys.exit(1)

CSV_HEADERS = [
    "filing_date",
    "trade_date",
    "ticker",
    "company_name",
    "owner_name",
    "title",
    "transaction_type",
    "price",
    "quantity",
    "owned",
    "shares_held",
    "value",
    "value_numeric",
]

TX_LABEL = {
    "P": "Purchase",
    "S": "Sale",
    "A": "Grant",
    "F": "Tax",
    "G": "Gift",
    "M": "Exercise",
    "D": "Disposition",
    "C": "Conversion",
    "W": "Will",
    "H": "Holdings",
    "O": "Other",
    "X": "Exercise",
}


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Export Form 4 rows to OpenInsider-compatible CSV")
    p.add_argument("--days", type=int, help="Last N calendar days (UTC), inclusive of today")
    p.add_argument("--from", dest="from_date", help="Start YYYY-MM-DD (with --to)")
    p.add_argument("--to", dest="to_date", help="End YYYY-MM-DD (default: today UTC)")
    p.add_argument("-o", "--out", help="Output CSV path (default: data/edgar_form4_<range>.csv)")
    p.add_argument("--chunk-days", type=int, default=7, help="Filing-date window per SEC request")
    p.add_argument("--max-filings", type=int, default=0, help="Cap filings per chunk (0 = no cap)")
    p.add_argument("--sleep-ms", type=int, default=80, help="Pause between filings (SEC courtesy)")
    p.add_argument("--dry-run", action="store_true", help="Count only; do not write CSV")
    return p.parse_args()


def utc_today() -> date:
    return datetime.now(timezone.utc).date()


def parse_ymd(s: str) -> date:
    return datetime.strptime(s, "%Y-%m-%d").date()


def day_range(args: argparse.Namespace) -> tuple[date, date]:
    end = parse_ymd(args.to_date) if args.to_date else utc_today()
    if args.from_date:
        start = parse_ymd(args.from_date)
    elif args.days and args.days > 0:
        start = end - timedelta(days=args.days - 1)
    else:
        raise SystemExit("Use --days N or --from YYYY-MM-DD [--to YYYY-MM-DD]")
    if start > end:
        raise SystemExit(f"Invalid range: {start} > {end}")
    return start, end


def iter_chunks(start: date, end: date, chunk_days: int) -> Iterator[tuple[date, date]]:
    cur = start
    while cur <= end:
        chunk_end = min(end, cur + timedelta(days=chunk_days - 1))
        yield cur, chunk_end
        cur = chunk_end + timedelta(days=1)


def filing_date_param(d0: date, d1: date) -> str:
    if d0 == d1:
        return d0.isoformat()
    return f"{d0.isoformat()}:{d1.isoformat()}"


def clean_ticker(raw: Any) -> str:
    s = str(raw or "").strip().upper()
    m = re.match(r"^([A-Z0-9.-]+)", s)
    return m.group(1) if m else s


def clean_company(raw: Any) -> str:
    s = str(raw or "").strip()
    s = re.sub(r"\s*\([A-Z0-9.-]+\)\s*$", "", s).strip()
    return s


def to_ymd(val: Any) -> str:
    if val is None or val == "":
        return ""
    if hasattr(val, "strftime"):
        return val.strftime("%Y-%m-%d")
    s = str(val).strip()
    if "T" in s:
        s = s.split("T", 1)[0]
    return s[:10] if len(s) >= 10 else s


def parse_num(val: Any) -> float | None:
    if val is None or val == "":
        return None
    try:
        n = float(val)
        return n if n == n else None  # NaN check
    except (TypeError, ValueError):
        return None


def format_tx_type(code: str, tx_type: str) -> str:
    code = (code or "").strip().upper()
    label = (tx_type or "").strip() or TX_LABEL.get(code, "Unknown")
    if code and "-" not in label:
        return f"{code} - {label}"
    return label or "Unknown"


def signed_quantity(code: str, shares: float | None) -> str:
    if shares is None:
        return ""
    n = abs(shares)
    if code == "S" or (shares < 0):
        return f"-{n:g}"
    return f"{n:g}"


def signed_value(code: str, value: float | None) -> tuple[str, str]:
    if value is None:
        return "", ""
    v = abs(value)
    if code == "S":
        v = -v
    return (f"${v:,.0f}" if v == int(v) else f"${v:,.2f}", str(int(round(v))) if v == int(v) else str(round(v, 2)))


def rows_from_filing(filing: Any, filing_date: str) -> list[dict[str, str]]:
    form4 = filing.obj()
    df = form4.to_dataframe(detailed=True)
    if df is None or df.empty:
        return []

    out: list[dict[str, str]] = []
    for _, row in df.iterrows():
        code = str(row.get("Code", "") or "").strip().upper()
        ticker = clean_ticker(row.get("Ticker"))
        if not ticker:
            continue

        shares = parse_num(row.get("Shares"))
        price = parse_num(row.get("Price"))
        value = parse_num(row.get("Value"))
        if value is None and shares is not None and price is not None:
            value = shares * price

        value_str, value_num = signed_value(code, value)
        trade_date = to_ymd(row.get("Date")) or filing_date

        out.append(
            {
                "filing_date": filing_date,
                "trade_date": trade_date,
                "ticker": ticker,
                "company_name": clean_company(row.get("Issuer")) or ticker,
                "owner_name": str(row.get("Insider", "") or "").strip(),
                "title": str(row.get("Position", "") or "").strip(),
                "transaction_type": format_tx_type(code, str(row.get("Transaction Type", ""))),
                "price": "" if price is None else str(price),
                "quantity": signed_quantity(code, shares),
                "owned": "",
                "shares_held": "" if row.get("Remaining Shares") is None else str(row.get("Remaining Shares")),
                "value": value_str,
                "value_numeric": value_num,
            }
        )
    return out


def default_out_path(start: date, end: date) -> str:
    root = os.path.join(os.path.dirname(__file__), "..", "data")
    os.makedirs(root, exist_ok=True)
    return os.path.join(root, f"edgar_form4_{start.isoformat()}_{end.isoformat()}.csv")


def main() -> None:
    args = parse_args()
    identity = (
        os.environ.get("EDGAR_IDENTITY")
        or os.environ.get("SEC_IDENTITY")
        or "Insider Flow insiderflow.asia team@insiderflow.asia"
    )
    set_identity(identity)

    start, end = day_range(args)
    out_path = os.path.abspath(args.out or default_out_path(start, end))

    summary = {
        "identity": identity,
        "range": {"from": start.isoformat(), "to": end.isoformat()},
        "chunkDays": args.chunk_days,
        "filingsProcessed": 0,
        "transactionRows": 0,
        "errors": 0,
        "out": out_path,
        "dryRun": args.dry_run,
    }

    print(
        f"edgar_form4_export: {start} → {end} (chunks={args.chunk_days}d, identity={identity})",
        flush=True,
    )

    writer: csv.DictWriter | None = None
    fh = None
    if not args.dry_run:
        fh = open(out_path, "w", newline="", encoding="utf-8")
        writer = csv.DictWriter(fh, fieldnames=CSV_HEADERS)
        writer.writeheader()

    t0 = time.time()
    try:
        for c0, c1 in iter_chunks(start, end, max(1, args.chunk_days)):
            param = filing_date_param(c0, c1)
            print(f"[chunk] filing_date={param}", flush=True)
            try:
                filings = get_filings(form="4", filing_date=param)
            except Exception as e:
                summary["errors"] += 1
                print(f"  chunk fetch failed: {e}", file=sys.stderr, flush=True)
                continue

            n_filings = len(filings)
            cap = args.max_filings if args.max_filings > 0 else n_filings
            print(f"  filings={n_filings} processing={min(n_filings, cap)}", flush=True)

            for i, filing in enumerate(filings):
                if i >= cap:
                    break
                filing_date = to_ymd(getattr(filing, "filing_date", None)) or c1.isoformat()
                try:
                    rows = rows_from_filing(filing, filing_date)
                    summary["filingsProcessed"] += 1
                    summary["transactionRows"] += len(rows)
                    if writer:
                        writer.writerows(rows)
                except Exception as e:
                    summary["errors"] += 1
                    if summary["errors"] <= 10:
                        print(f"  filing error ({filing_date}): {e}", file=sys.stderr, flush=True)
                if args.sleep_ms > 0:
                    time.sleep(args.sleep_ms / 1000.0)
    finally:
        if fh:
            fh.close()

    summary["elapsedSec"] = round(time.time() - t0, 1)
    print(summary, flush=True)
    if not args.dry_run:
        print(f"Wrote {summary['transactionRows']} rows → {out_path}", flush=True)
        print(
            f"Import: npm run openinsider:import-csv -- {out_path}",
            flush=True,
        )


if __name__ == "__main__":
    main()
