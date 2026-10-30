-- Rename the unreleased company modes. SimIntPay never deducted its fees from Delivery payments, so every
-- existing company is additive-only; history is not backfilled.
ALTER TABLE "company" ALTER COLUMN "platformFeeMode" SET DEFAULT 'ADDITIVE_ONLY';
UPDATE "company" SET "platformFeeMode" = CASE "platformFeeMode"
  WHEN 'simintpay' THEN 'SIMINTPAY_ONLY'
  WHEN 'extras' THEN 'ADDITIVE_ONLY'
  WHEN 'both' THEN 'ADDITIVE_ONLY'
  ELSE "platformFeeMode"
END;
ALTER TABLE "order" ADD COLUMN "feeMode" TEXT NOT NULL DEFAULT 'ADDITIVE_ONLY';
ALTER TABLE "payment_attempt" ADD COLUMN "feeMode" TEXT NOT NULL DEFAULT 'ADDITIVE_ONLY';
ALTER TABLE "payment" ADD COLUMN "simintpayFeeCents" INTEGER NOT NULL DEFAULT 0;
