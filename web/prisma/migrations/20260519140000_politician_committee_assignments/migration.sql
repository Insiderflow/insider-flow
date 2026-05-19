-- AlterTable
ALTER TABLE "Politician" ADD COLUMN IF NOT EXISTS "committee_assignments" JSONB;
