-- Add human-readable URL identifiers scoped to their owning company.
ALTER TABLE "unit" ADD COLUMN "slug" TEXT;
ALTER TABLE "product" ADD COLUMN "slug" TEXT;

WITH slugs AS (
	SELECT id, COALESCE(NULLIF(trim(BOTH '-' FROM regexp_replace(lower(translate(name, 'ÀÁÂÃÄÅàáâãäåÇçÈÉÊËèéêëÌÍÎÏìíîïÑñÒÓÔÕÖòóôõöÙÚÛÜùúûüÝýÿ', 'AAAAAAaaaaaaCcEEEEeeeeIIIIiiiiNnOOOOOoooooUUUUuuuuYyy')), '[^a-z0-9]+', '-', 'g')), ''), 'unidade') AS base_slug
	FROM "unit"
), ranked AS (
	SELECT id, base_slug, row_number() OVER (PARTITION BY base_slug, "companyId" ORDER BY id) AS occurrence
	FROM slugs JOIN "unit" USING (id)
)
UPDATE "unit" SET "slug" = CASE WHEN occurrence = 1 THEN base_slug ELSE base_slug || '-' || occurrence END
FROM ranked WHERE "unit".id = ranked.id;

WITH slugs AS (
	SELECT id, COALESCE(NULLIF(trim(BOTH '-' FROM regexp_replace(lower(translate(title, 'ÀÁÂÃÄÅàáâãäåÇçÈÉÊËèéêëÌÍÎÏìíîïÑñÒÓÔÕÖòóôõöÙÚÛÜùúûüÝýÿ', 'AAAAAAaaaaaaCcEEEEeeeeIIIIiiiiNnOOOOOoooooUUUUuuuuYyy')), '[^a-z0-9]+', '-', 'g')), ''), 'produto') AS base_slug
	FROM "product"
), ranked AS (
	SELECT id, base_slug, row_number() OVER (PARTITION BY base_slug, "companyId" ORDER BY id) AS occurrence
	FROM slugs JOIN "product" USING (id)
)
UPDATE "product" SET "slug" = CASE WHEN occurrence = 1 THEN base_slug ELSE base_slug || '-' || occurrence END
FROM ranked WHERE "product".id = ranked.id;

ALTER TABLE "unit" ALTER COLUMN "slug" SET NOT NULL;
ALTER TABLE "product" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "unit_companyId_slug_key" ON "unit"("companyId", "slug");
CREATE UNIQUE INDEX "product_companyId_slug_key" ON "product"("companyId", "slug");
