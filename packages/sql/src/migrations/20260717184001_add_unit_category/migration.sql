-- AlterTable
ALTER TABLE "category" DROP COLUMN "position";

-- CreateTable
CREATE TABLE "unit_category" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "unit_category_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "unit_category_unitId_idx" ON "unit_category"("unitId");

-- CreateIndex
CREATE INDEX "unit_category_categoryId_idx" ON "unit_category"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "unit_category_unitId_categoryId_key" ON "unit_category"("unitId", "categoryId");

-- AddForeignKey
ALTER TABLE "unit_category" ADD CONSTRAINT "unit_category_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit_category" ADD CONSTRAINT "unit_category_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
