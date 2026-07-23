-- Sparse per-unit overrides and unit-only options for shared product option groups.
CREATE TABLE "unit_product_option_override" (
    "unitProductId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "imageUrl" TEXT,
    "priceDeltaCents" INTEGER,
    "maxPerItem" INTEGER,
    "available" BOOLEAN,
    "sortOrder" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "unit_product_option_override_pkey" PRIMARY KEY ("unitProductId", "optionId")
);

CREATE INDEX "unit_product_option_override_optionId_idx"
    ON "unit_product_option_override"("optionId");

ALTER TABLE "unit_product_option_override"
    ADD CONSTRAINT "unit_product_option_override_unitProductId_fkey"
    FOREIGN KEY ("unitProductId") REFERENCES "unit_product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "unit_product_option_override"
    ADD CONSTRAINT "unit_product_option_override_optionId_fkey"
    FOREIGN KEY ("optionId") REFERENCES "option"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "unit_product_additional_option" (
    "id" TEXT NOT NULL,
    "unitProductId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "imageUrl" TEXT,
    "priceDeltaCents" INTEGER NOT NULL DEFAULT 0,
    "maxPerItem" INTEGER,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "unit_product_additional_option_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "unit_product_additional_option_groupId_idx"
    ON "unit_product_additional_option"("groupId");
CREATE INDEX "unit_product_additional_option_unitProductId_idx"
    ON "unit_product_additional_option"("unitProductId");

ALTER TABLE "unit_product_additional_option"
    ADD CONSTRAINT "unit_product_additional_option_unitProductId_fkey"
    FOREIGN KEY ("unitProductId") REFERENCES "unit_product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "unit_product_additional_option"
    ADD CONSTRAINT "unit_product_additional_option_groupId_fkey"
    FOREIGN KEY ("groupId") REFERENCES "option_group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
