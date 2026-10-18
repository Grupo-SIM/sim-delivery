-- Run only after rolling back the application; removes saved provisioning emails.
ALTER TABLE "company" DROP COLUMN "ownerEmail";
