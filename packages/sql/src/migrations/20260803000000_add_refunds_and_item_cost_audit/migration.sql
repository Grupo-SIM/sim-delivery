-- Refunds: track partial/repeated refund events against a payment, and denormalize the
-- running total onto both Payment and Order so reports never need to join/aggregate.
ALTER TABLE "payment" ADD COLUMN "refundedAmount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "payment" ADD COLUMN "refundedAt" TIMESTAMP(3);

ALTER TABLE "order" ADD COLUMN "refundedCents" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "refund" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT,
    "method" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "externalId" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "refund_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "refund_companyId_createdAt_idx" ON "refund"("companyId", "createdAt");
CREATE INDEX "refund_orderId_idx" ON "refund"("orderId");

ALTER TABLE "refund" ADD CONSTRAINT "refund_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "refund" ADD CONSTRAINT "refund_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "refund" ADD CONSTRAINT "refund_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "refund" ADD CONSTRAINT "refund_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Realized item cost audit trail: `costCents` now means cost currently incurred (adjusted
-- on cancel/reopen); `costCentsAtSale` is the immutable cost snapshot from order creation.
ALTER TABLE "order_item" ADD COLUMN "costCentsAtSale" INTEGER;
ALTER TABLE "order_item" ADD COLUMN "costRecalculatedAt" TIMESTAMP(3);

UPDATE "order_item" SET "costCentsAtSale" = "costCents" WHERE "costCents" IS NOT NULL;

-- Speeds up the reports module's period-filtered order queries (financial analytics,
-- best sellers, dashboard analytics), which all filter on companyId + status + createdAt.
CREATE INDEX "order_companyId_status_createdAt_idx" ON "order"("companyId", "status", "createdAt");
