ALTER TABLE "order" ADD COLUMN "feeTotalCents" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "platform_fee" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameKey" TEXT NOT NULL,
    "applicationScope" TEXT NOT NULL,
    "calculationType" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "displayMode" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "platform_fee_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "platform_fee_value_check" CHECK ("value" > 0),
    CONSTRAINT "platform_fee_scope_check" CHECK ("applicationScope" IN ('product', 'order')),
    CONSTRAINT "platform_fee_calculation_check" CHECK ("calculationType" IN ('fixed', 'percentage')),
    CONSTRAINT "platform_fee_display_check" CHECK ("displayMode" IN ('product_explicit', 'embedded', 'checkout_only')),
    CONSTRAINT "platform_fee_order_display_check" CHECK ("applicationScope" <> 'order' OR "displayMode" = 'checkout_only'),
    CONSTRAINT "platform_fee_percentage_check" CHECK ("calculationType" <> 'percentage' OR "value" <= 10000)
);

CREATE UNIQUE INDEX "platform_fee_nameKey_key" ON "platform_fee"("nameKey");
CREATE INDEX "platform_fee_active_deletedAt_idx" ON "platform_fee"("active", "deletedAt");

CREATE TABLE "company_fee_override" (
    "feeId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "valueOverride" INTEGER,
    "active" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "company_fee_override_pkey" PRIMARY KEY ("feeId", "companyId"),
    CONSTRAINT "company_fee_override_value_check" CHECK ("valueOverride" IS NULL OR "valueOverride" > 0)
);

CREATE INDEX "company_fee_override_companyId_idx" ON "company_fee_override"("companyId");

CREATE TABLE "order_fee_snapshot" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "platformFeeId" TEXT,
    "name" TEXT NOT NULL,
    "applicationScope" TEXT NOT NULL,
    "calculationType" TEXT NOT NULL,
    "configuredValue" INTEGER NOT NULL,
    "displayMode" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "order_fee_snapshot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "order_fee_snapshot_orderId_idx" ON "order_fee_snapshot"("orderId");
CREATE INDEX "order_fee_snapshot_platformFeeId_idx" ON "order_fee_snapshot"("platformFeeId");

CREATE TABLE "order_item_fee_snapshot" (
    "id" TEXT NOT NULL,
    "orderFeeSnapshotId" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "unitAmountCents" INTEGER NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "order_item_fee_snapshot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "order_item_fee_snapshot_orderFeeSnapshotId_orderItemId_key" ON "order_item_fee_snapshot"("orderFeeSnapshotId", "orderItemId");
CREATE INDEX "order_item_fee_snapshot_orderItemId_idx" ON "order_item_fee_snapshot"("orderItemId");

ALTER TABLE "company_fee_override" ADD CONSTRAINT "company_fee_override_feeId_fkey" FOREIGN KEY ("feeId") REFERENCES "platform_fee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "company_fee_override" ADD CONSTRAINT "company_fee_override_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_fee_snapshot" ADD CONSTRAINT "order_fee_snapshot_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_fee_snapshot" ADD CONSTRAINT "order_fee_snapshot_platformFeeId_fkey" FOREIGN KEY ("platformFeeId") REFERENCES "platform_fee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "order_item_fee_snapshot" ADD CONSTRAINT "order_item_fee_snapshot_orderFeeSnapshotId_fkey" FOREIGN KEY ("orderFeeSnapshotId") REFERENCES "order_fee_snapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_item_fee_snapshot" ADD CONSTRAINT "order_item_fee_snapshot_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "order_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Rollback: drop order_item_fee_snapshot, order_fee_snapshot, company_fee_override,
-- platform_fee, then order.feeTotalCents.
