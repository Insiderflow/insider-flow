-- AlterTable
ALTER TABLE "public"."subscription_events"
ADD COLUMN "retry_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "next_retry_at" TIMESTAMP(3);
