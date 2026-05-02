-- Finnhub / external 13F-style institutional snapshot rows (per symbol × report × investor).

CREATE TABLE "institutional_holding_snapshots" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "report_date" TIMESTAMP(3) NOT NULL,
    "investor_cik" TEXT,
    "investor_name" TEXT NOT NULL,
    "put_call" TEXT,
    "change_shares" DECIMAL(30,4),
    "shares_held" DECIMAL(30,4),
    "value_usd" DECIMAL(30,4),
    "pct_portfolio" DECIMAL(14,8),
    "data_source" TEXT NOT NULL DEFAULT 'finnhub',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "institutional_holding_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "institutional_holding_snapshots_symbol_idx" ON "institutional_holding_snapshots"("symbol");

CREATE INDEX "institutional_holding_snapshots_report_date_idx" ON "institutional_holding_snapshots"("report_date");
