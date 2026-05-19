-- CreateEnum
CREATE TYPE "ReferencePortfolioTemplate" AS ENUM ('politician_mirror', 'flagged_buys');

-- CreateTable
CREATE TABLE "user_reference_portfolios" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "template" "ReferencePortfolioTemplate" NOT NULL,
    "politician_id" TEXT,
    "period_days" INTEGER NOT NULL DEFAULT 30,
    "position_limit" INTEGER NOT NULL DEFAULT 10,
    "last_built_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_reference_portfolios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_reference_portfolio_positions" (
    "id" TEXT NOT NULL,
    "portfolio_id" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "issuer_name" TEXT,
    "side" TEXT NOT NULL,
    "weight_pct" DOUBLE PRECISION NOT NULL,
    "source_trade_id" TEXT,
    "disclosure_date" TIMESTAMP(3),
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_reference_portfolio_positions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_reference_portfolios_user_id_idx" ON "user_reference_portfolios"("user_id");

-- CreateIndex
CREATE INDEX "user_reference_portfolio_positions_portfolio_id_idx" ON "user_reference_portfolio_positions"("portfolio_id");

-- AddForeignKey
ALTER TABLE "user_reference_portfolios" ADD CONSTRAINT "user_reference_portfolios_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_reference_portfolios" ADD CONSTRAINT "user_reference_portfolios_politician_id_fkey" FOREIGN KEY ("politician_id") REFERENCES "Politician"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_reference_portfolio_positions" ADD CONSTRAINT "user_reference_portfolio_positions_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "user_reference_portfolios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
