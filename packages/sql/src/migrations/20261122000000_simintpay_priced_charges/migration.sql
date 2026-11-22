-- SimIntPay prices every new charge; allocation columns stay readable for history only.
ALTER TABLE "order" ADD COLUMN "additiveFeeRevision" TEXT;

ALTER TABLE "payment" ADD COLUMN "totalAmountCents" INTEGER,
 ADD COLUMN "netAmountCents" INTEGER;

ALTER TABLE "payment_attempt" ADD COLUMN "baseAmountCents" INTEGER,
 ALTER COLUMN "merchantAmountCents" DROP NOT NULL,
 ALTER COLUMN "platformFeeCents" DROP NOT NULL,
 DROP CONSTRAINT "payment_attempt_item_breakdown_check",
 ADD CONSTRAINT "payment_attempt_item_breakdown_check" CHECK (
 ("itemsAmountCents" IS NULL AND "deliveryAmountCents" IS NULL) OR
 ("itemsAmountCents" IS NOT NULL AND "deliveryAmountCents" IS NOT NULL AND
  "itemsAmountCents" >= 0 AND "deliveryAmountCents" >= 0 AND
  "itemsAmountCents"::bigint + "deliveryAmountCents"::bigint =
   COALESCE("baseAmountCents", "merchantAmountCents")::bigint)),
 ADD CONSTRAINT "payment_attempt_pricing_contract_check" CHECK (
 "baseAmountCents" IS NOT NULL OR
 ("merchantAmountCents" IS NOT NULL AND "platformFeeCents" IS NOT NULL));
