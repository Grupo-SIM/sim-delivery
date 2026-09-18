CREATE TABLE "company_whatsapp_connection" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "sessionName" TEXT NOT NULL,
    "connectedPhone" TEXT,
    "lastStatus" TEXT,
    "lastError" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "company_whatsapp_connection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "company_whatsapp_connection_companyId_key" ON "company_whatsapp_connection"("companyId");
CREATE UNIQUE INDEX "company_whatsapp_connection_sessionName_key" ON "company_whatsapp_connection"("sessionName");
ALTER TABLE "company_whatsapp_connection" ADD CONSTRAINT "company_whatsapp_connection_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
