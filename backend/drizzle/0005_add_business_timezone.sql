-- Migration: Add timezone column to businesses table
-- Stores IANA timezone identifier (e.g. 'Europe/Skopje')
-- Defaults to Europe/Skopje for Macedonia launch

ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "timezone" text NOT NULL DEFAULT 'Europe/Skopje';
