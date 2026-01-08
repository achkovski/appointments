-- Migration: Add auto-complete appointments feature
-- This migration adds support for automatically completing past appointments

-- Add completed_automatically column to appointments table
-- This tracks whether an appointment was marked as completed by the system
-- or manually by the business owner
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "completed_automatically" boolean DEFAULT false NOT NULL;
