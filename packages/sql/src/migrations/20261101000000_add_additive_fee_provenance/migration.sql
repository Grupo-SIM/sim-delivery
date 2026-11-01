ALTER TABLE "company_simpay_integration"
ADD COLUMN "additiveFeeRevision" TEXT,
ADD COLUMN "additiveFeeOverridden" BOOLEAN NOT NULL DEFAULT false;
