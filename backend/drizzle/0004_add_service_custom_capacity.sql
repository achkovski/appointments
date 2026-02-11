-- Migration: Add per-service custom capacity
-- Allows each service to override the business default capacity
-- Only applies when business is in MULTIPLE capacity mode
-- NULL means "use business default capacity"

ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "custom_capacity" integer;
