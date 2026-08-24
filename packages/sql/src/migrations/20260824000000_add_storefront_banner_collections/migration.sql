ALTER TABLE "company"
ADD COLUMN "homepageBannerUrl" TEXT;

ALTER TABLE "unit"
ADD COLUMN "bannerUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "unit"
SET "bannerUrls" = ARRAY["bannerUrl"]
WHERE "bannerUrl" IS NOT NULL AND "bannerUrl" <> '';

ALTER TABLE "unit"
DROP COLUMN "bannerUrl";
