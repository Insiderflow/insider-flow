-- Track last mutation for daily digest (rows updated by import keep old created_at).
ALTER TABLE "Trade" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "Trade" SET "updated_at" = "created_at";
