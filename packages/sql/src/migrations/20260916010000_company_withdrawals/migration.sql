ALTER TABLE "company"
ADD COLUMN "cnpj" TEXT,
ADD COLUMN "withdrawalMinimumCents" INTEGER,
ADD COLUMN "withdrawalPixKey" TEXT,
ADD COLUMN "simpayMerchantId" TEXT;

CREATE UNIQUE INDEX "company_cnpj_key" ON "company"("cnpj");

CREATE TABLE "withdrawal" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "externalWithdrawalId" TEXT,
    "grossAmountCents" INTEGER NOT NULL,
    "feeCents" INTEGER NOT NULL DEFAULT 0,
    "netAmountCents" INTEGER NOT NULL DEFAULT 0,
    "pixKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'submitting',
    "rejectionReason" TEXT,
    "providerCreatedAt" TIMESTAMP(3),
    "providerUpdatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "withdrawal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "withdrawal_status_event" (
    "id" TEXT NOT NULL,
    "withdrawalId" TEXT NOT NULL,
    "providerEventId" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "withdrawal_status_event_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "withdrawal_externalWithdrawalId_key" ON "withdrawal"("externalWithdrawalId");
CREATE INDEX "withdrawal_companyId_createdAt_idx" ON "withdrawal"("companyId", "createdAt");
CREATE INDEX "withdrawal_companyId_status_idx" ON "withdrawal"("companyId", "status");
CREATE UNIQUE INDEX "withdrawal_status_event_providerEventId_key" ON "withdrawal_status_event"("providerEventId");
CREATE INDEX "withdrawal_status_event_withdrawalId_createdAt_idx" ON "withdrawal_status_event"("withdrawalId", "createdAt");

ALTER TABLE "withdrawal" ADD CONSTRAINT "withdrawal_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "withdrawal" ADD CONSTRAINT "withdrawal_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "withdrawal_status_event" ADD CONSTRAINT "withdrawal_status_event_withdrawalId_fkey" FOREIGN KEY ("withdrawalId") REFERENCES "withdrawal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
