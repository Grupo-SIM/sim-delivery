-- Existing companies keep today's behavior: SimIntPay fees plus platform surcharges.
ALTER TABLE "company" ADD COLUMN "platformFeeMode" TEXT NOT NULL DEFAULT 'both';
