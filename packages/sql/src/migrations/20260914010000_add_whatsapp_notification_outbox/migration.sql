CREATE TABLE "whatsapp_notification" (
    "id" TEXT NOT NULL,
    "orderId" TEXT,
    "recipient" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "orderStatus" TEXT NOT NULL,
    "deduplicationKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leaseUntil" TIMESTAMP(3),
    "lastError" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_notification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "whatsapp_notification_deduplicationKey_key"
ON "whatsapp_notification"("deduplicationKey");

CREATE INDEX "whatsapp_notification_status_nextAttemptAt_idx"
ON "whatsapp_notification"("status", "nextAttemptAt");

CREATE INDEX "whatsapp_notification_status_leaseUntil_idx"
ON "whatsapp_notification"("status", "leaseUntil");

CREATE INDEX "whatsapp_notification_orderId_idx"
ON "whatsapp_notification"("orderId");

ALTER TABLE "whatsapp_notification"
ADD CONSTRAINT "whatsapp_notification_orderId_fkey"
FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Rollback: DROP TABLE "whatsapp_notification";
