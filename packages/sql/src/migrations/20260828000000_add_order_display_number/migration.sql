ALTER TABLE "order" ADD COLUMN "displayNumber" SERIAL;

ALTER TABLE "order" ALTER COLUMN "displayNumber" SET NOT NULL;

CREATE UNIQUE INDEX "order_displayNumber_key" ON "order"("displayNumber");
