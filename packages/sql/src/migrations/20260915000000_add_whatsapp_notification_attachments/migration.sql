ALTER TABLE "whatsapp_notification"
ADD COLUMN "attachments" JSONB NOT NULL DEFAULT '[]';

-- Rollback: ALTER TABLE "whatsapp_notification" DROP COLUMN "attachments";
