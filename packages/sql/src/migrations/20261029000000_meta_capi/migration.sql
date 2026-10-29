-- AlterTable
ALTER TABLE "company" ADD COLUMN     "address" TEXT,
ADD COLUMN     "legalName" TEXT,
ADD COLUMN     "metaCapiToken" TEXT,
ADD COLUMN     "privacyContactEmail" TEXT,
ADD COLUMN     "privacyContactPhone" TEXT;

-- AlterTable
ALTER TABLE "order" ADD COLUMN     "marketingAttribution" JSONB;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "registrationEventPendingAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "MarketingEvent" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "eventName" TEXT NOT NULL DEFAULT 'Purchase',
    "eventId" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "eventTime" TIMESTAMP(3) NOT NULL,
    "payload" JSONB NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextRetryAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAt" TIMESTAMP(3),
    "lockToken" TEXT,
    "sentAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MarketingEvent_eventId_key" ON "MarketingEvent"("eventId");

-- CreateIndex
CREATE INDEX "MarketingEvent_sentAt_failedAt_nextRetryAt_idx" ON "MarketingEvent"("sentAt", "failedAt", "nextRetryAt");

-- CreateIndex
CREATE UNIQUE INDEX "MarketingEvent_orderId_eventName_key" ON "MarketingEvent"("orderId", "eventName");

-- AddForeignKey
ALTER TABLE "MarketingEvent" ADD CONSTRAINT "MarketingEvent_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingEvent" ADD CONSTRAINT "MarketingEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

