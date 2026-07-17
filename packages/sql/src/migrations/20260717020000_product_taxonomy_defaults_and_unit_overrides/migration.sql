-- Product-level category/tag defaults and per-unit explicit overrides.
CREATE TABLE "product_category" (
    "productId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "product_category_pkey" PRIMARY KEY ("productId", "categoryId")
);

CREATE TABLE "product_tag" (
    "productId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "product_tag_pkey" PRIMARY KEY ("productId", "tagId")
);

CREATE TABLE "unit_product_category" (
    "unitProductId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "unit_product_category_pkey" PRIMARY KEY ("unitProductId", "categoryId")
);

CREATE TABLE "unit_product_tag" (
    "unitProductId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "unit_product_tag_pkey" PRIMARY KEY ("unitProductId", "tagId")
);

ALTER TABLE "unit_product"
    ADD COLUMN "categoriesOverridden" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "tagsOverridden" BOOLEAN NOT NULL DEFAULT false;

-- Preserve legacy per-unit categories as explicit category overrides.
INSERT INTO "unit_product_category" ("unitProductId", "categoryId")
SELECT "id", "categoryId" FROM "unit_product" WHERE "categoryId" IS NOT NULL;
UPDATE "unit_product" SET "categoriesOverridden" = true WHERE "categoryId" IS NOT NULL;

CREATE INDEX "product_category_categoryId_idx" ON "product_category"("categoryId");
CREATE INDEX "product_tag_tagId_idx" ON "product_tag"("tagId");
CREATE INDEX "unit_product_category_categoryId_idx" ON "unit_product_category"("categoryId");
CREATE INDEX "unit_product_tag_tagId_idx" ON "unit_product_tag"("tagId");

ALTER TABLE "product_category" ADD CONSTRAINT "product_category_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_category" ADD CONSTRAINT "product_category_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_tag" ADD CONSTRAINT "product_tag_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_tag" ADD CONSTRAINT "product_tag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "unit_product_category" ADD CONSTRAINT "unit_product_category_unitProductId_fkey" FOREIGN KEY ("unitProductId") REFERENCES "unit_product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "unit_product_category" ADD CONSTRAINT "unit_product_category_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "unit_product_tag" ADD CONSTRAINT "unit_product_tag_unitProductId_fkey" FOREIGN KEY ("unitProductId") REFERENCES "unit_product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "unit_product_tag" ADD CONSTRAINT "unit_product_tag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "unit_product" DROP CONSTRAINT "unit_product_categoryId_fkey";
ALTER TABLE "unit_product" DROP COLUMN "categoryId";

-- Rollback (data-destructive for plural assignments): recreate categoryId, copy one category
-- per unit product, restore its FK, then drop join tables and override columns.
