-- Optional per-unit CPF/CNPJ plus company-level choice of which document identifies orders and withdrawals.
ALTER TABLE "unit" ADD COLUMN "cnpj" TEXT;

ALTER TABLE "company" ADD COLUMN "orderCnpjSource" TEXT NOT NULL DEFAULT 'UNIT',
 ADD COLUMN "withdrawalCnpjSource" TEXT NOT NULL DEFAULT 'UNIT',
 ADD CONSTRAINT "company_order_cnpj_source_check" CHECK ("orderCnpjSource" IN ('UNIT', 'COMPANY')),
 ADD CONSTRAINT "company_withdrawal_cnpj_source_check" CHECK ("withdrawalCnpjSource" IN ('UNIT', 'COMPANY'));

ALTER TABLE "order" ADD COLUMN "cnpj" TEXT;

ALTER TABLE "withdrawal" ADD COLUMN "unitId" TEXT,
 ADD COLUMN "cnpj" TEXT;
