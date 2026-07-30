ALTER TABLE "payment" ADD COLUMN "confirmedAt" TIMESTAMP(3);

ALTER TABLE "courier_unit" RENAME TO "staff_unit";
ALTER TABLE "staff_unit" RENAME COLUMN "courierId" TO "userId";
ALTER TABLE "staff_unit" RENAME CONSTRAINT "courier_unit_pkey" TO "staff_unit_pkey";
ALTER TABLE "staff_unit" RENAME CONSTRAINT "courier_unit_courierId_fkey" TO "staff_unit_userId_fkey";
ALTER TABLE "staff_unit" RENAME CONSTRAINT "courier_unit_unitId_fkey" TO "staff_unit_unitId_fkey";
ALTER INDEX "courier_unit_unitId_idx" RENAME TO "staff_unit_unitId_idx";
