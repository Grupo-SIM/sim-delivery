ALTER TABLE "company"
ADD COLUMN "homepageBannerUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "company"
SET "homepageBannerUrls" = ARRAY["homepageBannerUrl"]
WHERE "homepageBannerUrl" IS NOT NULL AND "homepageBannerUrl" <> '';

ALTER TABLE "company"
DROP COLUMN "homepageBannerUrl";
