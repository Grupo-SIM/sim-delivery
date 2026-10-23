-- Null preserves the original contract of in-flight attempts; never backfill history.
ALTER TABLE "payment_attempt" ADD COLUMN "itemsAmountCents" INTEGER,
 ADD COLUMN "deliveryAmountCents" INTEGER,
 ADD CONSTRAINT "payment_attempt_item_breakdown_check" CHECK (
 ("itemsAmountCents" IS NULL AND "deliveryAmountCents" IS NULL) OR
 ("itemsAmountCents" IS NOT NULL AND "deliveryAmountCents" IS NOT NULL AND
  "itemsAmountCents" >= 0 AND "deliveryAmountCents" >= 0 AND
  "itemsAmountCents"::bigint + "deliveryAmountCents"::bigint = "merchantAmountCents"::bigint));
