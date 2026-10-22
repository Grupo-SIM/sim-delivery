CREATE TABLE "company_simpay_integration" (
 "companyId" TEXT PRIMARY KEY REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 "registrationId" TEXT NOT NULL, "platformId" TEXT, "platformTag" TEXT, "merchantId" TEXT,
 "status" TEXT NOT NULL DEFAULT 'PENDING_OWNER', "encryptedAccessToken" TEXT, "encryptedWebhookSecret" TEXT,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL
);
ALTER TABLE "saved_card" ADD COLUMN "bin" TEXT;
CREATE TABLE "payment_attempt" (
 "id" TEXT PRIMARY KEY, "orderId" TEXT NOT NULL, "companyId" TEXT NOT NULL, "method" TEXT NOT NULL,
 "state" TEXT NOT NULL DEFAULT 'preparing', "amountCents" INTEGER NOT NULL, "merchantAmountCents" INTEGER NOT NULL,
 "platformFeeCents" INTEGER NOT NULL, "requestHash" TEXT NOT NULL, "providerTransactionId" TEXT, "providerPaymentId" TEXT,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "payment_attempt_orderId_createdAt_idx" ON "payment_attempt"("orderId", "createdAt");
CREATE INDEX "payment_attempt_state_updatedAt_idx" ON "payment_attempt"("state", "updatedAt");
CREATE UNIQUE INDEX "payment_attempt_active_order_key" ON "payment_attempt"("orderId") WHERE "state" IN ('preparing', 'submitting', 'pending');
CREATE TABLE "simpay_webhook_inbox" (
 "id" TEXT PRIMARY KEY, "companyId" TEXT NOT NULL, "eventId" TEXT NOT NULL, "payload" JSONB NOT NULL,
 "processedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE ("companyId", "eventId")
);
CREATE INDEX "simpay_webhook_inbox_processedAt_createdAt_idx" ON "simpay_webhook_inbox"("processedAt", "createdAt");
