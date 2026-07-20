CREATE TABLE "promotional_image" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "linkUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "promotional_image_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "unit_promotional_image" (
    "unitId" TEXT NOT NULL,
    "promotionalImageId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "unit_promotional_image_pkey" PRIMARY KEY ("unitId", "promotionalImageId")
);

CREATE INDEX "promotional_image_companyId_idx" ON "promotional_image"("companyId");
CREATE INDEX "unit_promotional_image_promotionalImageId_idx" ON "unit_promotional_image"("promotionalImageId");

ALTER TABLE "promotional_image"
ADD CONSTRAINT "promotional_image_companyId_fkey"
FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "unit_promotional_image"
ADD CONSTRAINT "unit_promotional_image_unitId_fkey"
FOREIGN KEY ("unitId") REFERENCES "unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "unit_promotional_image"
ADD CONSTRAINT "unit_promotional_image_promotionalImageId_fkey"
FOREIGN KEY ("promotionalImageId") REFERENCES "promotional_image"("id") ON DELETE CASCADE ON UPDATE CASCADE;
