-- Add has_completed_setup column to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "has_completed_setup" boolean DEFAULT false NOT NULL;

-- Set has_completed_setup to true for users who already have a business
UPDATE "users" SET "has_completed_setup" = true
WHERE "id" IN (SELECT DISTINCT "owner_id" FROM "businesses");
