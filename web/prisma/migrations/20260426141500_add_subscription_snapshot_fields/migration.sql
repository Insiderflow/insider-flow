-- AlterTable
ALTER TABLE "public"."User"
ADD COLUMN "subscription_status" TEXT,
ADD COLUMN "billing_provider" TEXT,
ADD COLUMN "subscription_entitlement_id" TEXT,
ADD COLUMN "subscription_last_synced_at" TIMESTAMP(3);
