-- Static web and native builds resolve this configuration directly from the company.
ALTER TABLE "company"
    ADD COLUMN "packageName" TEXT,
    ADD COLUMN "siteUrl" TEXT,
    ADD COLUMN "apiUrl" TEXT;

CREATE UNIQUE INDEX "company_packageName_key" ON "company"("packageName");
