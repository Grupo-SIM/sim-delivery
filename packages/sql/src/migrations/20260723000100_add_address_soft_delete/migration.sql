ALTER TABLE "address" ADD COLUMN "deletedAt" TIMESTAMP(3);
CREATE INDEX "address_customerId_deletedAt_idx" ON "address"("customerId", "deletedAt");
