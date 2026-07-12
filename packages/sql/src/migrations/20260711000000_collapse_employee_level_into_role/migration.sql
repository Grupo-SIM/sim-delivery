-- Collapse "employee" + level into direct top-level roles (manager | attendant | kitchen)

UPDATE "user" SET "role" = COALESCE("level", 'attendant') WHERE "role" = 'employee';

-- AlterTable
ALTER TABLE "user" DROP COLUMN "level";
