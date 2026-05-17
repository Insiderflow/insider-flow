-- Additive industry sub-sector taxonomy (does not change Issuer.sector).

CREATE TABLE "IndustrySubsector" (
    "slug" TEXT NOT NULL,
    "parent_sector" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IndustrySubsector_pkey" PRIMARY KEY ("slug")
);

CREATE INDEX "IndustrySubsector_parent_sector_idx" ON "IndustrySubsector"("parent_sector");

ALTER TABLE "Issuer" ADD COLUMN "sub_sector_slug" TEXT;

CREATE INDEX "Issuer_sub_sector_slug_idx" ON "Issuer"("sub_sector_slug");

ALTER TABLE "Issuer" ADD CONSTRAINT "Issuer_sub_sector_slug_fkey"
    FOREIGN KEY ("sub_sector_slug") REFERENCES "IndustrySubsector"("slug")
    ON DELETE SET NULL ON UPDATE CASCADE;
