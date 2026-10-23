BEGIN;

CREATE UNIQUE INDEX "customer_companyId_userId_key" ON "customer"("companyId", "userId");
DROP INDEX "customer_userId_key";

COMMIT;
