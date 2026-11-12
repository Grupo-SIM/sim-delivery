ALTER TABLE "discount"
ADD COLUMN "categoryIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
