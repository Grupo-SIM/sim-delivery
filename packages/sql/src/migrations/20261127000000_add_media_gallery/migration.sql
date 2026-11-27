-- Media gallery: per-company registry of uploaded images plus a view of every record that references one.
CREATE TABLE "media_asset" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_asset_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "media_asset_companyId_filename_key" ON "media_asset"("companyId", "filename");
CREATE INDEX "media_asset_companyId_lastUsedAt_id_idx" ON "media_asset"("companyId", "lastUsedAt" DESC, "id" DESC);

ALTER TABLE "media_asset" ADD CONSTRAINT "media_asset_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Last path segment of a stored media URL (CDN or API origin), ignoring any query string or fragment.
CREATE FUNCTION "media_filename"(url TEXT) RETURNS TEXT
LANGUAGE sql IMMUTABLE PARALLEL SAFE AS
$$ SELECT substring(url from '([^/?#]+)(?:[?#].*)?$') $$;

-- Every image reference in the schema, one row per (record, image). Searching the gallery by name matches
-- `name` (the record owning the image) and `context` (its parent, e.g. the product of an option).
-- Add a UNION branch here whenever a new image column is introduced.
CREATE VIEW "media_usage" AS
SELECT p."companyId", p."imageUrl" AS "url", 'product' AS "entityType", p."id" AS "entityId", p."title" AS "name", NULL::TEXT AS "context", p."createdAt"
FROM "product" p WHERE p."imageUrl" <> ''
UNION ALL
SELECT c."companyId", c."imageUrl", 'category', c."id", c."name", NULL, c."createdAt"
FROM "category" c WHERE c."imageUrl" <> ''
UNION ALL
SELECT p."companyId", o."imageUrl", 'option', o."id", o."name", p."title", o."createdAt"
FROM "option" o
JOIN "option_group" g ON g."id" = o."groupId"
JOIN "product" p ON p."id" = g."productId"
WHERE o."imageUrl" IS NOT NULL AND o."imageUrl" <> ''
UNION ALL
SELECT u."companyId", a."imageUrl", 'unitOption', a."id", a."name", u."name", a."createdAt"
FROM "unit_product_additional_option" a
JOIN "unit_product" up ON up."id" = a."unitProductId"
JOIN "unit" u ON u."id" = up."unitId"
WHERE a."imageUrl" IS NOT NULL AND a."imageUrl" <> ''
UNION ALL
SELECT u."companyId", ov."imageUrl", 'unitOption', ov."optionId", COALESCE(ov."name", o."name"), u."name", ov."createdAt"
FROM "unit_product_option_override" ov
JOIN "option" o ON o."id" = ov."optionId"
JOIN "unit_product" up ON up."id" = ov."unitProductId"
JOIN "unit" u ON u."id" = up."unitId"
WHERE ov."imageUrl" IS NOT NULL AND ov."imageUrl" <> ''
UNION ALL
SELECT u."companyId", up."imageUrl", 'unitProduct', up."id", p."title", u."name", up."createdAt"
FROM "unit_product" up
JOIN "unit" u ON u."id" = up."unitId"
JOIN "product" p ON p."id" = up."productId"
WHERE up."imageUrl" IS NOT NULL AND up."imageUrl" <> ''
UNION ALL
SELECT u."companyId", u."imageUrl", 'unit', u."id", u."name", NULL, u."createdAt"
FROM "unit" u WHERE u."imageUrl" IS NOT NULL AND u."imageUrl" <> ''
UNION ALL
SELECT u."companyId", b."url", 'unitBanner', u."id", u."name", NULL, u."createdAt"
FROM "unit" u, LATERAL unnest(u."bannerUrls") AS b("url") WHERE b."url" <> ''
UNION ALL
SELECT pi."companyId", pi."imageUrl", 'promotion', pi."id", pi."title", NULL, pi."createdAt"
FROM "promotional_image" pi WHERE pi."imageUrl" <> ''
UNION ALL
SELECT c."id", c."logoUrl", 'companyLogo', c."id", c."name", NULL, c."createdAt"
FROM "company" c WHERE c."logoUrl" IS NOT NULL AND c."logoUrl" <> ''
UNION ALL
SELECT c."id", c."mobileIconUrl", 'companyMobileIcon', c."id", c."name", NULL, c."createdAt"
FROM "company" c WHERE c."mobileIconUrl" IS NOT NULL AND c."mobileIconUrl" <> ''
UNION ALL
SELECT c."id", c."unitFallbackImageUrl", 'companyUnitFallback', c."id", c."name", NULL, c."createdAt"
FROM "company" c WHERE c."unitFallbackImageUrl" IS NOT NULL AND c."unitFallbackImageUrl" <> '';

-- Backfill from existing references. The real upload date is unknown, so use the owning record's creation date.
INSERT INTO "media_asset" ("id", "companyId", "filename", "url", "createdAt", "lastUsedAt")
SELECT gen_random_uuid()::TEXT, "companyId", "filename", "url", "createdAt", "createdAt"
FROM (
    SELECT DISTINCT ON (mu."companyId", media_filename(mu."url"))
        mu."companyId", media_filename(mu."url") AS "filename", mu."url", mu."createdAt"
    FROM "media_usage" mu
    WHERE media_filename(mu."url") ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(avif|jpg|png|webp)$'
    ORDER BY mu."companyId", media_filename(mu."url"), mu."createdAt" ASC
) backfill;
