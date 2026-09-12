ALTER TABLE "order" ADD COLUMN "idempotencyKey" TEXT;

CREATE UNIQUE INDEX "order_customerId_idempotencyKey_key"
ON "order"("customerId", "idempotencyKey");
