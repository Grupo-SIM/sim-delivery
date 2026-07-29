-- Company-wide image used by storefront unit cards with no dedicated image.
-- The column may already exist after a partially applied migration.
ALTER TABLE "company" ADD COLUMN IF NOT EXISTS "unitFallbackImageUrl" TEXT;
