ALTER TABLE "company"
    ADD COLUMN "footerPaymentMethods" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    ADD COLUMN "footerInstagramUrl" TEXT,
    ADD COLUMN "footerFacebookUrl" TEXT,
    ADD COLUMN "footerWhatsApp" TEXT,
    ADD COLUMN "footerSupportEmail" TEXT;
