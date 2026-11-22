-- Redirect destination becomes per company (a unit, or an arbitrary URL); the link itself stays global.
CREATE TABLE "utm_link_destination" (
    "id" TEXT NOT NULL,
    "utmLinkId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "unitSlug" TEXT,
    "url" TEXT,

    CONSTRAINT "utm_link_destination_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "utm_link_destination_utmLinkId_companyId_key" ON "utm_link_destination"("utmLinkId", "companyId");

ALTER TABLE "utm_link_destination" ADD CONSTRAINT "utm_link_destination_utmLinkId_fkey" FOREIGN KEY ("utmLinkId") REFERENCES "utm_link"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "utm_link_destination" ADD CONSTRAINT "utm_link_destination_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- The single global destination so far applies to every company.
INSERT INTO "utm_link_destination" ("id", "utmLinkId", "companyId", "url")
SELECT 'utd_' || md5(l."id" || c."id"), l."id", c."id", l."url"
FROM "utm_link" l CROSS JOIN "company" c WHERE l."url" IS NOT NULL;

ALTER TABLE "utm_link" DROP COLUMN "url";
