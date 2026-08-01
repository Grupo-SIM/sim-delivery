-- AlterTable
ALTER TABLE "option_group"
    DROP COLUMN "selectionType",
    ALTER COLUMN "maxSelect" DROP NOT NULL,
    ALTER COLUMN "maxSelect" DROP DEFAULT,
    ADD COLUMN "allowRepeatSelection" BOOLEAN NOT NULL DEFAULT false;
