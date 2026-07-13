-- AlterTable
ALTER TABLE "unit" ADD COLUMN     "deliveryFeeFallbackEnabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "delivery_zone" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "radiusKm" DOUBLE PRECISION NOT NULL,
    "fee" INTEGER NOT NULL,
    "etaMinMinutes" INTEGER,
    "etaMaxMinutes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_zone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "delivery_zone_unitId_idx" ON "delivery_zone"("unitId");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_zone_unitId_radiusKm_key" ON "delivery_zone"("unitId", "radiusKm");

-- AddForeignKey
ALTER TABLE "delivery_zone" ADD CONSTRAINT "delivery_zone_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
