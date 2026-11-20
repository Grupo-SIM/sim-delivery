ALTER TABLE "order"
ADD COLUMN "firstUtmSource" TEXT,
ADD COLUMN "firstUtmMedium" TEXT,
ADD COLUMN "firstUtmCampaign" TEXT,
ADD COLUMN "firstUtmContent" TEXT,
ADD COLUMN "firstUtmTerm" TEXT,
ADD COLUMN "lastUtmSource" TEXT,
ADD COLUMN "lastUtmMedium" TEXT,
ADD COLUMN "lastUtmCampaign" TEXT,
ADD COLUMN "lastUtmContent" TEXT,
ADD COLUMN "lastUtmTerm" TEXT,
ADD COLUMN "fbclid" TEXT;

CREATE INDEX "order_companyId_firstUtmSource_firstUtmMedium_firstUtmContent_idx" ON "order"("companyId", "firstUtmSource", "firstUtmMedium", "firstUtmContent");
