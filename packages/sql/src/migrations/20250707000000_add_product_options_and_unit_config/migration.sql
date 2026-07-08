-- É22.1: Product option groups and options
-- É23.1: Product/unit-product popularity and featured rank
-- É24.1: Unit minimum order and preparation time

-- AlterTable product: add popularity
ALTER TABLE "product" ADD COLUMN "popularity" INTEGER NOT NULL DEFAULT 0;

-- AlterTable unit_product: add featured rank
ALTER TABLE "unit_product" ADD COLUMN "featured_rank" INTEGER;

-- AlterTable unit: add min order and prep time
ALTER TABLE "unit" ADD COLUMN "min_order_cents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "unit" ADD COLUMN "prep_time_min_minutes" INTEGER;
ALTER TABLE "unit" ADD COLUMN "prep_time_max_minutes" INTEGER;

-- CreateTable option_group
CREATE TABLE "option_group" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "minSelect" INTEGER NOT NULL DEFAULT 0,
    "maxSelect" INTEGER NOT NULL DEFAULT 1,
    "selectionType" TEXT NOT NULL DEFAULT 'single',
    "priceRule" TEXT NOT NULL DEFAULT 'sum',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "option_group_pkey" PRIMARY KEY ("id")
);

-- CreateTable option
CREATE TABLE "option" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "imageUrl" TEXT,
    "priceDeltaCents" INTEGER NOT NULL DEFAULT 0,
    "maxPerItem" INTEGER,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "popularity" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "option_pkey" PRIMARY KEY ("id")
);

-- CreateTable order_item_option
CREATE TABLE "order_item_option" (
    "id" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "optionId" TEXT,
    "groupName" TEXT NOT NULL,
    "optionName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "priceDeltaCents" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "order_item_option_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "option_group_productId_idx" ON "option_group"("productId");

-- CreateIndex
CREATE INDEX "option_groupId_idx" ON "option"("groupId");

-- CreateIndex
CREATE INDEX "order_item_option_orderItemId_idx" ON "order_item_option"("orderItemId");

-- AddForeignKey
ALTER TABLE "option_group" ADD CONSTRAINT "option_group_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "option" ADD CONSTRAINT "option_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "option_group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item_option" ADD CONSTRAINT "order_item_option_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "order_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item_option" ADD CONSTRAINT "order_item_option_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "option"("id") ON DELETE SET NULL ON UPDATE CASCADE;
