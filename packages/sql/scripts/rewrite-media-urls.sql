-- Rewrites API media URLs (https://<api>/media/<uuid>.<ext>) to the CDN base URL (https://cdn.simintermediacoes.com/sim-delivery).
-- Run manually against the target database, after the new backend is deployed.
-- URLs that are not API media URLs (external, already on the CDN) are left untouched.

BEGIN;

-- Single-value URL columns.
UPDATE "company" SET
  "logoUrl" = regexp_replace("logoUrl", '^https?://[^/]+/media/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.][a-z0-9]+)$', 'https://cdn.simintermediacoes.com/sim-delivery/\1'),
  "mobileIconUrl" = regexp_replace("mobileIconUrl", '^https?://[^/]+/media/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.][a-z0-9]+)$', 'https://cdn.simintermediacoes.com/sim-delivery/\1'),
  "unitFallbackImageUrl" = regexp_replace("unitFallbackImageUrl", '^https?://[^/]+/media/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.][a-z0-9]+)$', 'https://cdn.simintermediacoes.com/sim-delivery/\1'),
  "fontFamilyUrl" = regexp_replace("fontFamilyUrl", '^https?://[^/]+/media/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.][a-z0-9]+)$', 'https://cdn.simintermediacoes.com/sim-delivery/\1'),
  "fontDisplayUrl" = regexp_replace("fontDisplayUrl", '^https?://[^/]+/media/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.][a-z0-9]+)$', 'https://cdn.simintermediacoes.com/sim-delivery/\1');

UPDATE "unit" SET "imageUrl" = regexp_replace("imageUrl", '^https?://[^/]+/media/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.][a-z0-9]+)$', 'https://cdn.simintermediacoes.com/sim-delivery/\1');
UPDATE "product" SET "imageUrl" = regexp_replace("imageUrl", '^https?://[^/]+/media/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.][a-z0-9]+)$', 'https://cdn.simintermediacoes.com/sim-delivery/\1');
UPDATE "category" SET "imageUrl" = regexp_replace("imageUrl", '^https?://[^/]+/media/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.][a-z0-9]+)$', 'https://cdn.simintermediacoes.com/sim-delivery/\1');
UPDATE "option" SET "imageUrl" = regexp_replace("imageUrl", '^https?://[^/]+/media/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.][a-z0-9]+)$', 'https://cdn.simintermediacoes.com/sim-delivery/\1');
UPDATE "unit_product_option_override" SET "imageUrl" = regexp_replace("imageUrl", '^https?://[^/]+/media/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.][a-z0-9]+)$', 'https://cdn.simintermediacoes.com/sim-delivery/\1');
UPDATE "unit_product_additional_option" SET "imageUrl" = regexp_replace("imageUrl", '^https?://[^/]+/media/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.][a-z0-9]+)$', 'https://cdn.simintermediacoes.com/sim-delivery/\1');
UPDATE "promotional_image" SET "imageUrl" = regexp_replace("imageUrl", '^https?://[^/]+/media/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.][a-z0-9]+)$', 'https://cdn.simintermediacoes.com/sim-delivery/\1');
UPDATE "user" SET "image" = regexp_replace("image", '^https?://[^/]+/media/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.][a-z0-9]+)$', 'https://cdn.simintermediacoes.com/sim-delivery/\1');

-- Array column (order preserved: bannerLinks is indexed in parallel).
UPDATE "unit" SET "bannerUrls" = ARRAY(
  SELECT regexp_replace(u, '^https?://[^/]+/media/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.][a-z0-9]+)$', 'https://cdn.simintermediacoes.com/sim-delivery/\1')
  FROM unnest("bannerUrls") WITH ORDINALITY AS t(u, i)
  ORDER BY i
)
WHERE cardinality("bannerUrls") > 0;

-- JSON columns holding attachment/template URLs.
UPDATE "company" SET
  "orderStatusWhatsAppTemplates" = regexp_replace("orderStatusWhatsAppTemplates"::text, 'https?://[^"/]+/media/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.][a-z0-9]+)', 'https://cdn.simintermediacoes.com/sim-delivery/\1', 'g')::jsonb,
  "orderStatusEmailTemplates" = regexp_replace("orderStatusEmailTemplates"::text, 'https?://[^"/]+/media/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.][a-z0-9]+)', 'https://cdn.simintermediacoes.com/sim-delivery/\1', 'g')::jsonb,
  "receiptTemplate" = regexp_replace("receiptTemplate"::text, 'https?://[^"/]+/media/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.][a-z0-9]+)', 'https://cdn.simintermediacoes.com/sim-delivery/\1', 'g')::jsonb;

UPDATE "whatsapp_notification" SET
  "attachments" = regexp_replace("attachments"::text, 'https?://[^"/]+/media/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.][a-z0-9]+)', 'https://cdn.simintermediacoes.com/sim-delivery/\1', 'g')::jsonb
WHERE "attachments"::text LIKE '%/media/%';

-- Sanity check: every count should be 0.
SELECT 'company' AS t, count(*) FROM "company"
  WHERE concat_ws(' ', "logoUrl", "mobileIconUrl", "unitFallbackImageUrl", "fontFamilyUrl", "fontDisplayUrl",
    "orderStatusWhatsAppTemplates"::text, "orderStatusEmailTemplates"::text, "receiptTemplate"::text) LIKE '%/media/%'
UNION ALL SELECT 'unit', count(*) FROM "unit" WHERE "imageUrl" LIKE '%/media/%' OR array_to_string("bannerUrls", ' ') LIKE '%/media/%'
UNION ALL SELECT 'product', count(*) FROM "product" WHERE "imageUrl" LIKE '%/media/%'
UNION ALL SELECT 'category', count(*) FROM "category" WHERE "imageUrl" LIKE '%/media/%'
UNION ALL SELECT 'option', count(*) FROM "option" WHERE "imageUrl" LIKE '%/media/%'
UNION ALL SELECT 'promotional_image', count(*) FROM "promotional_image" WHERE "imageUrl" LIKE '%/media/%'
UNION ALL SELECT 'whatsapp_notification', count(*) FROM "whatsapp_notification" WHERE "attachments"::text LIKE '%/media/%';

COMMIT;
