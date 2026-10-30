-- Fees may combine a percentage and a fixed amount (e.g. 4% + R$ 1,00).
ALTER TABLE "platform_fee" ADD COLUMN "percentageValue" INTEGER NOT NULL DEFAULT 0, ADD COLUMN "fixedValue" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "company_fee_override" ADD COLUMN "percentageOverride" INTEGER, ADD COLUMN "fixedOverride" INTEGER;
ALTER TABLE "order_fee_snapshot" ADD COLUMN "configuredPercentage" INTEGER NOT NULL DEFAULT 0, ADD COLUMN "configuredFixed" INTEGER NOT NULL DEFAULT 0;

UPDATE "company_fee_override" o SET
    "percentageOverride" = CASE WHEN f."calculationType" = 'percentage' THEN o."valueOverride" END,
    "fixedOverride" = CASE WHEN f."calculationType" = 'fixed' THEN o."valueOverride" END
FROM "platform_fee" f WHERE f."id" = o."feeId";

UPDATE "platform_fee" SET
    "percentageValue" = CASE WHEN "calculationType" = 'percentage' THEN "value" ELSE 0 END,
    "fixedValue" = CASE WHEN "calculationType" = 'fixed' THEN "value" ELSE 0 END;

UPDATE "order_fee_snapshot" SET
    "configuredPercentage" = CASE WHEN "calculationType" = 'percentage' THEN "configuredValue" ELSE 0 END,
    "configuredFixed" = CASE WHEN "calculationType" = 'fixed' THEN "configuredValue" ELSE 0 END;

-- Dropping the columns also drops the check constraints that reference them.
ALTER TABLE "platform_fee" DROP COLUMN "calculationType", DROP COLUMN "value";
ALTER TABLE "company_fee_override" DROP COLUMN "valueOverride";
ALTER TABLE "order_fee_snapshot" DROP COLUMN "calculationType", DROP COLUMN "configuredValue";

ALTER TABLE "platform_fee" ADD CONSTRAINT "platform_fee_amount_check" CHECK ("percentageValue" BETWEEN 0 AND 10000 AND "fixedValue" >= 0 AND ("percentageValue" > 0 OR "fixedValue" > 0));
ALTER TABLE "company_fee_override" ADD CONSTRAINT "company_fee_override_amount_check" CHECK (("percentageOverride" IS NULL OR "percentageOverride" BETWEEN 0 AND 10000) AND ("fixedOverride" IS NULL OR "fixedOverride" >= 0));
