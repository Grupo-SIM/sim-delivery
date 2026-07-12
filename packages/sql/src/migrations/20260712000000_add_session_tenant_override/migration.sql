-- Per-session tenant/role override, set at sign-in from the requesting site's companyId.

-- AlterTable
ALTER TABLE "session" ADD COLUMN "companyId" TEXT,
ADD COLUMN "role" TEXT;
