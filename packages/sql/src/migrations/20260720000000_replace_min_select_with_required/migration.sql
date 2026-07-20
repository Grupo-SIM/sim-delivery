-- Collapse OptionGroup.minSelect (0 = optional, >=1 = required) into a boolean `required` flag.
ALTER TABLE "option_group" ADD COLUMN "required" BOOLEAN NOT NULL DEFAULT false;

UPDATE "option_group" SET "required" = true WHERE "minSelect" >= 1;

ALTER TABLE "option_group" DROP COLUMN "minSelect";
