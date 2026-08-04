-- Dedicated source for the mobile app icon. Falls back to logoUrl (with safe padding) when unset.
ALTER TABLE "company" ADD COLUMN IF NOT EXISTS "mobileIconUrl" TEXT;
