ALTER TABLE "order" ADD COLUMN "preparedById" TEXT;

CREATE INDEX "order_preparedById_idx" ON "order"("preparedById");

ALTER TABLE "order"
    ADD CONSTRAINT "order_preparedById_fkey"
    FOREIGN KEY ("preparedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
