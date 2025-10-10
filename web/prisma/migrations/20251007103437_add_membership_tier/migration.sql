-- CreateEnum
CREATE TYPE "public"."MembershipTier" AS ENUM ('FREE', 'PAID');

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "membership_expires_at" TIMESTAMP(3),
ADD COLUMN     "membership_tier" "public"."MembershipTier" NOT NULL DEFAULT 'FREE';
