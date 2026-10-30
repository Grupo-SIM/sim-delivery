-- Zero preserves history; never backfill past payments.
ALTER TABLE "payment" ADD COLUMN "coproductionCents" INTEGER NOT NULL DEFAULT 0;
