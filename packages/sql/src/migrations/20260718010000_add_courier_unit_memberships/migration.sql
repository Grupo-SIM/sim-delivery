CREATE TABLE "courier_unit" (
    "courierId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,

    CONSTRAINT "courier_unit_pkey" PRIMARY KEY ("courierId", "unitId")
);

CREATE INDEX "courier_unit_unitId_idx" ON "courier_unit"("unitId");

ALTER TABLE "courier_unit"
    ADD CONSTRAINT "courier_unit_courierId_fkey"
    FOREIGN KEY ("courierId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "courier_unit"
    ADD CONSTRAINT "courier_unit_unitId_fkey"
    FOREIGN KEY ("unitId") REFERENCES "unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
