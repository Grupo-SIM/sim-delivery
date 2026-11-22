-- UTM links become global: keep one row per path (the oldest id), then drop the company scope.
DELETE FROM "utm_link" a USING "utm_link" b WHERE a."path" = b."path" AND a."id" > b."id";

ALTER TABLE "utm_link" DROP CONSTRAINT "utm_link_companyId_fkey";
DROP INDEX "utm_link_companyId_path_key";
ALTER TABLE "utm_link" DROP COLUMN "companyId";
ALTER TABLE "utm_link" ADD COLUMN "url" TEXT;
UPDATE "utm_link" SET "url" = '/' || "unitSlug" WHERE "unitSlug" IS NOT NULL;
ALTER TABLE "utm_link" DROP COLUMN "unitSlug";
CREATE UNIQUE INDEX "utm_link_path_key" ON "utm_link"("path");
