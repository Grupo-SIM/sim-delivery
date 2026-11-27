-- Automatic cleanup of unused gallery images: the sweep marks assets nobody references and deletes them after a retention period.
ALTER TABLE "media_asset" ADD COLUMN "unusedSince" TIMESTAMP(3);
