CREATE TABLE "unit_whatsapp_connection" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "sessionName" TEXT NOT NULL,
    "connectedPhone" TEXT,
    "lastStatus" TEXT,
    "lastError" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "unit_whatsapp_connection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "unit_whatsapp_connection_unitId_key"
ON "unit_whatsapp_connection"("unitId");

CREATE UNIQUE INDEX "unit_whatsapp_connection_sessionName_key"
ON "unit_whatsapp_connection"("sessionName");

CREATE INDEX "unit_whatsapp_connection_companyId_idx"
ON "unit_whatsapp_connection"("companyId");

ALTER TABLE "unit_whatsapp_connection"
ADD CONSTRAINT "unit_whatsapp_connection_companyId_fkey"
FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "unit_whatsapp_connection"
ADD CONSTRAINT "unit_whatsapp_connection_unitId_fkey"
FOREIGN KEY ("unitId") REFERENCES "unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Rollback: DROP TABLE "unit_whatsapp_connection";
