-- Preserve each company's existing banner for all of its units before removing
-- the company-wide setting.
ALTER TABLE "unit" ADD COLUMN "bannerUrl" TEXT;

UPDATE "unit"
SET "bannerUrl" = "company"."bannerUrl"
FROM "company"
WHERE "unit"."companyId" = "company"."id";

ALTER TABLE "company" DROP COLUMN "bannerUrl";
