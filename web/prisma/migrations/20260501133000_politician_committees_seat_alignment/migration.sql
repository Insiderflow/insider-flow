-- AlterTable
ALTER TABLE "Politician" ADD COLUMN IF NOT EXISTS "committees" TEXT;

-- AlterEnum
ALTER TYPE "AlertType" ADD VALUE IF NOT EXISTS 'seat_alignment';
