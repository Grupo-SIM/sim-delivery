-- SimIntPay dictates the fee mode; Delivery keeps no copy of it.
ALTER TABLE "company" DROP COLUMN "platformFeeMode";
ALTER TABLE "order" DROP COLUMN "feeMode";
ALTER TABLE "payment_attempt" DROP COLUMN "feeMode";
