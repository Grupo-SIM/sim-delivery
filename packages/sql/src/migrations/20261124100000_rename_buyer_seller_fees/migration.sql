-- Buyer fees (formerly "additive") and seller fees (formerly "SimIntPay fee") get distinct names so they are never mixed.
ALTER TABLE "order" RENAME COLUMN "feeTotalCents" TO "buyerFeeTotalCents";
ALTER TABLE "order" RENAME COLUMN "additiveFeeRevision" TO "buyerFeeRevision";
ALTER TABLE "payment" RENAME COLUMN "simintpayFeeCents" TO "sellerFeeCents";
ALTER TABLE "company_simpay_integration" RENAME COLUMN "additiveFeeRevision" TO "buyerFeeRevision";
ALTER TABLE "company_simpay_integration" RENAME COLUMN "additiveFeeOverridden" TO "buyerFeeOverridden";
