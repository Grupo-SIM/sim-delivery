ALTER TABLE "user" ADD COLUMN "themePreference" TEXT;
ALTER TABLE "company" ADD COLUMN "defaultTheme" TEXT NOT NULL DEFAULT 'light';
