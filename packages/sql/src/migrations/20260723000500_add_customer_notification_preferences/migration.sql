ALTER TABLE "customer"
ADD COLUMN "notificationEmail" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "notificationWhatsApp" BOOLEAN NOT NULL DEFAULT true;
