-- Optional JSON layout keeps existing companies on the application default until customized.
ALTER TABLE "company" ADD COLUMN "receiptTemplate" JSONB;

-- Rollback: ALTER TABLE "company" DROP COLUMN "receiptTemplate";
