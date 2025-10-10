-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "stripe_customer_id" TEXT,
ADD COLUMN     "stripe_subscription_id" TEXT;
