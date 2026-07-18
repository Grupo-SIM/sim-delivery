-- Per-unit exclusions for globally defined product options.
CREATE TABLE "unit_product_excluded_option" (
    "unitProductId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "unit_product_excluded_option_pkey" PRIMARY KEY ("unitProductId", "optionId")
);

CREATE INDEX "unit_product_excluded_option_optionId_idx"
    ON "unit_product_excluded_option"("optionId");

ALTER TABLE "unit_product_excluded_option"
    ADD CONSTRAINT "unit_product_excluded_option_unitProductId_fkey"
    FOREIGN KEY ("unitProductId") REFERENCES "unit_product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "unit_product_excluded_option"
    ADD CONSTRAINT "unit_product_excluded_option_optionId_fkey"
    FOREIGN KEY ("optionId") REFERENCES "option"("id") ON DELETE CASCADE ON UPDATE CASCADE;
