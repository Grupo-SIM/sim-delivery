-- The 20250707000000_add_product_options_and_unit_config migration added these columns
-- with quoted snake_case names ("min_order_cents", etc.), but every other column in this
-- schema is unquoted/camelCase with no @map — so Prisma looks for "minOrderCents" and gets
-- "column does not exist". Rename to camelCase if the snake_case column is present,
-- otherwise create it fresh (covers DBs where the original migration never ran).

DO $$
BEGIN
	IF EXISTS (
		SELECT 1 FROM information_schema.columns WHERE table_name = 'unit' AND column_name = 'min_order_cents'
	) THEN
		ALTER TABLE "unit" RENAME COLUMN "min_order_cents" TO "minOrderCents";
	ELSIF NOT EXISTS (
		SELECT 1 FROM information_schema.columns WHERE table_name = 'unit' AND column_name = 'minOrderCents'
	) THEN
		ALTER TABLE "unit" ADD COLUMN "minOrderCents" INTEGER NOT NULL DEFAULT 0;
	END IF;

	IF EXISTS (
		SELECT 1 FROM information_schema.columns WHERE table_name = 'unit' AND column_name = 'prep_time_min_minutes'
	) THEN
		ALTER TABLE "unit" RENAME COLUMN "prep_time_min_minutes" TO "prepTimeMinMinutes";
	ELSIF NOT EXISTS (
		SELECT 1 FROM information_schema.columns WHERE table_name = 'unit' AND column_name = 'prepTimeMinMinutes'
	) THEN
		ALTER TABLE "unit" ADD COLUMN "prepTimeMinMinutes" INTEGER;
	END IF;

	IF EXISTS (
		SELECT 1 FROM information_schema.columns WHERE table_name = 'unit' AND column_name = 'prep_time_max_minutes'
	) THEN
		ALTER TABLE "unit" RENAME COLUMN "prep_time_max_minutes" TO "prepTimeMaxMinutes";
	ELSIF NOT EXISTS (
		SELECT 1 FROM information_schema.columns WHERE table_name = 'unit' AND column_name = 'prepTimeMaxMinutes'
	) THEN
		ALTER TABLE "unit" ADD COLUMN "prepTimeMaxMinutes" INTEGER;
	END IF;

	IF EXISTS (
		SELECT 1 FROM information_schema.columns WHERE table_name = 'unit_product' AND column_name = 'featured_rank'
	) THEN
		ALTER TABLE "unit_product" RENAME COLUMN "featured_rank" TO "featuredRank";
	ELSIF NOT EXISTS (
		SELECT 1 FROM information_schema.columns WHERE table_name = 'unit_product' AND column_name = 'featuredRank'
	) THEN
		ALTER TABLE "unit_product" ADD COLUMN "featuredRank" INTEGER;
	END IF;
END $$;
