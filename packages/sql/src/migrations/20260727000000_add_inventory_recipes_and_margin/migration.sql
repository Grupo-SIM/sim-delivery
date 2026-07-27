CREATE TABLE "inventory_item" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "inventory_item_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "inventory_item_companyId_name_key" ON "inventory_item"("companyId", "name");
CREATE INDEX "inventory_item_companyId_active_idx" ON "inventory_item"("companyId", "active");

CREATE TABLE "inventory_settings" (
    "companyId" TEXT NOT NULL,
    "coverageTargetDays" INTEGER NOT NULL DEFAULT 7,
    "consumptionWindowDays" INTEGER NOT NULL DEFAULT 30,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "inventory_settings_pkey" PRIMARY KEY ("companyId")
);

CREATE TABLE "unit_inventory_balance" (
    "unitId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "quantity" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "reservedQuantity" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "averageCostCents" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "unit_inventory_balance_pkey" PRIMARY KEY ("unitId", "inventoryItemId")
);
CREATE INDEX "unit_inventory_balance_inventoryItemId_idx" ON "unit_inventory_balance"("inventoryItemId");

CREATE TABLE "inventory_movement" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" DECIMAL(18,6) NOT NULL,
    "unitCostCents" DECIMAL(18,6),
    "reason" TEXT NOT NULL,
    "userId" TEXT,
    "orderId" TEXT,
    "balanceAfter" DECIMAL(18,6) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "inventory_movement_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "inventory_movement_unitId_createdAt_idx" ON "inventory_movement"("unitId", "createdAt");
CREATE INDEX "inventory_movement_inventoryItemId_createdAt_idx" ON "inventory_movement"("inventoryItemId", "createdAt");
CREATE INDEX "inventory_movement_orderId_idx" ON "inventory_movement"("orderId");

CREATE TABLE "product_recipe_ingredient" (
    "productId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "quantity" DECIMAL(18,6) NOT NULL,
    CONSTRAINT "product_recipe_ingredient_pkey" PRIMARY KEY ("productId", "inventoryItemId")
);
CREATE INDEX "product_recipe_ingredient_inventoryItemId_idx" ON "product_recipe_ingredient"("inventoryItemId");

CREATE TABLE "option_recipe_ingredient" (
    "optionId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "quantityDelta" DECIMAL(18,6) NOT NULL,
    CONSTRAINT "option_recipe_ingredient_pkey" PRIMARY KEY ("optionId", "inventoryItemId")
);
CREATE INDEX "option_recipe_ingredient_inventoryItemId_idx" ON "option_recipe_ingredient"("inventoryItemId");

CREATE TABLE "local_option_recipe_ingredient" (
    "localOptionId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "quantityDelta" DECIMAL(18,6) NOT NULL,
    CONSTRAINT "local_option_recipe_ingredient_pkey" PRIMARY KEY ("localOptionId", "inventoryItemId")
);
CREATE INDEX "local_option_recipe_ingredient_inventoryItemId_idx" ON "local_option_recipe_ingredient"("inventoryItemId");

CREATE TABLE "inventory_reservation" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderItemId" TEXT,
    "unitId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "quantity" DECIMAL(18,6) NOT NULL,
    "unitCostCents" DECIMAL(18,6) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'reserved',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "inventory_reservation_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "inventory_reservation_orderId_status_idx" ON "inventory_reservation"("orderId", "status");
CREATE INDEX "inventory_reservation_unitId_inventoryItemId_status_idx" ON "inventory_reservation"("unitId", "inventoryItemId", "status");

ALTER TABLE "order_item" ADD COLUMN "unitProductId" TEXT;
ALTER TABLE "order_item" ADD COLUMN "costCents" INTEGER;
ALTER TABLE "order_item" ADD COLUMN "netRevenueCents" INTEGER;

ALTER TABLE "inventory_item" ADD CONSTRAINT "inventory_item_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory_settings" ADD CONSTRAINT "inventory_settings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "unit_inventory_balance" ADD CONSTRAINT "unit_inventory_balance_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "unit_inventory_balance" ADD CONSTRAINT "unit_inventory_balance_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "inventory_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory_movement" ADD CONSTRAINT "inventory_movement_unitId_inventoryItemId_fkey" FOREIGN KEY ("unitId", "inventoryItemId") REFERENCES "unit_inventory_balance"("unitId", "inventoryItemId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory_movement" ADD CONSTRAINT "inventory_movement_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "inventory_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory_movement" ADD CONSTRAINT "inventory_movement_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory_movement" ADD CONSTRAINT "inventory_movement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "inventory_movement" ADD CONSTRAINT "inventory_movement_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "product_recipe_ingredient" ADD CONSTRAINT "product_recipe_ingredient_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_recipe_ingredient" ADD CONSTRAINT "product_recipe_ingredient_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "inventory_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "option_recipe_ingredient" ADD CONSTRAINT "option_recipe_ingredient_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "option"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "option_recipe_ingredient" ADD CONSTRAINT "option_recipe_ingredient_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "inventory_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "local_option_recipe_ingredient" ADD CONSTRAINT "local_option_recipe_ingredient_localOptionId_fkey" FOREIGN KEY ("localOptionId") REFERENCES "unit_product_additional_option"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "local_option_recipe_ingredient" ADD CONSTRAINT "local_option_recipe_ingredient_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "inventory_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory_reservation" ADD CONSTRAINT "inventory_reservation_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory_reservation" ADD CONSTRAINT "inventory_reservation_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "order_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory_reservation" ADD CONSTRAINT "inventory_reservation_unitId_inventoryItemId_fkey" FOREIGN KEY ("unitId", "inventoryItemId") REFERENCES "unit_inventory_balance"("unitId", "inventoryItemId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "inventory_reservation" ADD CONSTRAINT "inventory_reservation_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "inventory_item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "inventory_reservation" ADD CONSTRAINT "inventory_reservation_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
