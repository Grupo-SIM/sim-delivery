CREATE TABLE "utm_link" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "source" TEXT,
    "medium" TEXT,
    "campaign" TEXT,
    "content" TEXT,
    "unitSlug" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "utm_link_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "utm_link_companyId_path_key" ON "utm_link"("companyId", "path");

ALTER TABLE "utm_link" ADD CONSTRAINT "utm_link_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Keeps the previously hardcoded Instagram bio link working.
INSERT INTO "utm_link" ("id", "companyId", "path", "source", "medium", "campaign", "content", "updatedAt")
SELECT 'utm_' || md5("id" || 'instagram'), "id", 'instagram', 'ig', 'social', 'branding_instagram', 'link_in_bio', CURRENT_TIMESTAMP
FROM "company";
