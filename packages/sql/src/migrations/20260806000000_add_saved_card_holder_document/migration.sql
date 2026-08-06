-- Additive and nullable for compatibility with cards saved before holder CPF was collected separately.
ALTER TABLE "saved_card" ADD COLUMN "holderDocument" TEXT;

-- Rollback: ALTER TABLE "saved_card" DROP COLUMN "holderDocument";
