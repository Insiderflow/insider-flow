-- CreateTable
CREATE TABLE "public"."Issuer" (
    "id" TEXT NOT NULL,
    "ticker" TEXT,
    "name" TEXT NOT NULL,
    "sector" TEXT,
    "country" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Issuer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Politician" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "party" TEXT,
    "chamber" TEXT,
    "state" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Politician_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Session" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Trade" (
    "id" TEXT NOT NULL,
    "politician_id" TEXT NOT NULL,
    "issuer_id" TEXT NOT NULL,
    "published_at" TIMESTAMP(3),
    "traded_at" TIMESTAMP(3) NOT NULL,
    "filed_after_days" INTEGER,
    "owner" TEXT,
    "type" TEXT NOT NULL,
    "size_min" DECIMAL(65,30),
    "size_max" DECIMAL(65,30),
    "price" DECIMAL(65,30),
    "source_url" TEXT,
    "raw" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Trade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "email_verification_token" TEXT,
    "password_reset_token" TEXT,
    "password_reset_expires" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "notification_settings" JSONB,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserWatchlist" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "politician_id" TEXT,
    "company_id" TEXT,
    "owner_id" TEXT,
    "ticker" TEXT,
    "watchlist_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserWatchlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."openinsider_companies" (
    "id" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "openinsider_companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."openinsider_owners" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "isInstitution" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "openinsider_owners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."openinsider_transactions" (
    "id" TEXT NOT NULL,
    "transaction_date" TIMESTAMP(3) NOT NULL,
    "trade_date" TIMESTAMP(3) NOT NULL,
    "transaction_type" TEXT NOT NULL,
    "last_price" DECIMAL(65,30),
    "quantity" TEXT NOT NULL,
    "shares_held" TEXT NOT NULL,
    "owned" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "value_numeric" DECIMAL(65,30),
    "company_id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "openinsider_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Issuer_ticker_idx" ON "public"."Issuer"("ticker");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "public"."Session"("token");

-- CreateIndex
CREATE INDEX "Session_token_idx" ON "public"."Session"("token");

-- CreateIndex
CREATE INDEX "Session_user_id_idx" ON "public"."Session"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "UserWatchlist_user_id_idx" ON "public"."UserWatchlist"("user_id");

-- CreateIndex
CREATE INDEX "UserWatchlist_watchlist_type_idx" ON "public"."UserWatchlist"("watchlist_type");

-- CreateIndex
CREATE UNIQUE INDEX "UserWatchlist_user_id_politician_id_watchlist_type_key" ON "public"."UserWatchlist"("user_id", "politician_id", "watchlist_type");

-- CreateIndex
CREATE UNIQUE INDEX "UserWatchlist_user_id_company_id_watchlist_type_key" ON "public"."UserWatchlist"("user_id", "company_id", "watchlist_type");

-- CreateIndex
CREATE UNIQUE INDEX "UserWatchlist_user_id_owner_id_watchlist_type_key" ON "public"."UserWatchlist"("user_id", "owner_id", "watchlist_type");

-- CreateIndex
CREATE UNIQUE INDEX "UserWatchlist_user_id_ticker_watchlist_type_key" ON "public"."UserWatchlist"("user_id", "ticker", "watchlist_type");

-- CreateIndex
CREATE UNIQUE INDEX "openinsider_companies_ticker_key" ON "public"."openinsider_companies"("ticker");

-- CreateIndex
CREATE UNIQUE INDEX "openinsider_owners_name_key" ON "public"."openinsider_owners"("name");

-- CreateIndex
CREATE INDEX "openinsider_transactions_transaction_date_idx" ON "public"."openinsider_transactions"("transaction_date" DESC);

-- CreateIndex
CREATE INDEX "openinsider_transactions_trade_date_idx" ON "public"."openinsider_transactions"("trade_date" DESC);

-- CreateIndex
CREATE INDEX "openinsider_transactions_company_id_idx" ON "public"."openinsider_transactions"("company_id");

-- CreateIndex
CREATE INDEX "openinsider_transactions_owner_id_idx" ON "public"."openinsider_transactions"("owner_id");

-- CreateIndex
CREATE INDEX "openinsider_transactions_transaction_type_idx" ON "public"."openinsider_transactions"("transaction_type");

-- AddForeignKey
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Trade" ADD CONSTRAINT "Trade_issuer_id_fkey" FOREIGN KEY ("issuer_id") REFERENCES "public"."Issuer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Trade" ADD CONSTRAINT "Trade_politician_id_fkey" FOREIGN KEY ("politician_id") REFERENCES "public"."Politician"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserWatchlist" ADD CONSTRAINT "UserWatchlist_politician_id_fkey" FOREIGN KEY ("politician_id") REFERENCES "public"."Politician"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserWatchlist" ADD CONSTRAINT "UserWatchlist_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."openinsider_companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserWatchlist" ADD CONSTRAINT "UserWatchlist_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."openinsider_owners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserWatchlist" ADD CONSTRAINT "UserWatchlist_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."openinsider_transactions" ADD CONSTRAINT "openinsider_transactions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."openinsider_companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."openinsider_transactions" ADD CONSTRAINT "openinsider_transactions_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."openinsider_owners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
