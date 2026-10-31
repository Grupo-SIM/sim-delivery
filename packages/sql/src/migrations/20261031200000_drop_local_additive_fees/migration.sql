-- Additive fees now live in SimIntPay (source of truth). Run
-- backend/scripts/migrate-additive-fees-to-simintpay.ts --apply BEFORE applying this migration:
-- it copies platform_fee and company_fee_override rows to SimIntPay, and this drops them.
-- order_fee_snapshot.platformFeeId stays as a plain historical reference (no FK).
ALTER TABLE "order_fee_snapshot" DROP CONSTRAINT IF EXISTS "order_fee_snapshot_platformFeeId_fkey";
DROP TABLE "company_fee_override";
DROP TABLE "platform_fee";
