ALTER TABLE "whatsapp_notification"
ADD COLUMN "companyId" TEXT,
ADD COLUMN "unitId" TEXT,
ADD COLUMN "sessionName" TEXT;

CREATE INDEX "whatsapp_notification_companyId_unitId_idx"
ON "whatsapp_notification"("companyId", "unitId");

ALTER TABLE "whatsapp_notification"
ADD CONSTRAINT "whatsapp_notification_companyId_fkey"
FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "whatsapp_notification"
ADD CONSTRAINT "whatsapp_notification_unitId_fkey"
FOREIGN KEY ("unitId") REFERENCES "unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Rollback:
-- ALTER TABLE "whatsapp_notification" DROP CONSTRAINT "whatsapp_notification_unitId_fkey";
-- ALTER TABLE "whatsapp_notification" DROP CONSTRAINT "whatsapp_notification_companyId_fkey";
-- DROP INDEX "whatsapp_notification_companyId_unitId_idx";
-- ALTER TABLE "whatsapp_notification" DROP COLUMN "sessionName", DROP COLUMN "unitId", DROP COLUMN "companyId";
