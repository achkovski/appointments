-- Migration: Add employees feature
-- This migration adds support for employee management, employee-specific availability,
-- and employee assignment to appointments

-- Create employees table
CREATE TABLE IF NOT EXISTS "employees" (
    "id" text PRIMARY KEY NOT NULL,
    "business_id" text NOT NULL,
    "name" text NOT NULL,
    "email" text,
    "phone" text,
    "use_business_email" boolean DEFAULT false NOT NULL,
    "use_business_phone" boolean DEFAULT false NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "max_daily_appointments" integer DEFAULT 0,
    "created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) NOT NULL,
    CONSTRAINT "employees_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes for employees table
CREATE INDEX IF NOT EXISTS "employees_business_id_idx" ON "employees" USING btree ("business_id");
CREATE INDEX IF NOT EXISTS "employees_business_id_is_active_idx" ON "employees" USING btree ("business_id", "is_active");

-- Create employee_services junction table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS "employee_services" (
    "id" text PRIMARY KEY NOT NULL,
    "employee_id" text NOT NULL,
    "service_id" text NOT NULL,
    "created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "employee_services_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "employee_services_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create unique constraint to prevent duplicate assignments
CREATE UNIQUE INDEX IF NOT EXISTS "employee_services_employee_id_service_id_key" ON "employee_services" USING btree ("employee_id", "service_id");
CREATE INDEX IF NOT EXISTS "employee_services_employee_id_idx" ON "employee_services" USING btree ("employee_id");
CREATE INDEX IF NOT EXISTS "employee_services_service_id_idx" ON "employee_services" USING btree ("service_id");

-- Create employee_availability table (employee-specific working hours)
CREATE TABLE IF NOT EXISTS "employee_availability" (
    "id" text PRIMARY KEY NOT NULL,
    "employee_id" text NOT NULL,
    "day_of_week" integer NOT NULL,
    "start_time" time NOT NULL,
    "end_time" time NOT NULL,
    "is_available" boolean DEFAULT true NOT NULL,
    "created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) NOT NULL,
    CONSTRAINT "employee_availability_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes for employee_availability
CREATE INDEX IF NOT EXISTS "employee_availability_employee_id_idx" ON "employee_availability" USING btree ("employee_id");
CREATE INDEX IF NOT EXISTS "employee_availability_employee_id_day_of_week_idx" ON "employee_availability" USING btree ("employee_id", "day_of_week");

-- Create employee_breaks table
CREATE TABLE IF NOT EXISTS "employee_breaks" (
    "id" text PRIMARY KEY NOT NULL,
    "employee_availability_id" text NOT NULL,
    "break_start" time NOT NULL,
    "break_end" time NOT NULL,
    "created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "employee_breaks_employee_availability_id_fkey" FOREIGN KEY ("employee_availability_id") REFERENCES "employee_availability"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create index for employee_breaks
CREATE INDEX IF NOT EXISTS "employee_breaks_employee_availability_id_idx" ON "employee_breaks" USING btree ("employee_availability_id");

-- Create employee_special_dates table (employee-specific exceptions)
CREATE TABLE IF NOT EXISTS "employee_special_dates" (
    "id" text PRIMARY KEY NOT NULL,
    "employee_id" text NOT NULL,
    "date" date NOT NULL,
    "is_available" boolean DEFAULT false NOT NULL,
    "start_time" time,
    "end_time" time,
    "reason" text,
    "created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "employee_special_dates_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes for employee_special_dates
CREATE INDEX IF NOT EXISTS "employee_special_dates_employee_id_idx" ON "employee_special_dates" USING btree ("employee_id");
CREATE INDEX IF NOT EXISTS "employee_special_dates_employee_id_date_idx" ON "employee_special_dates" USING btree ("employee_id", "date");

-- Add employee_id column to appointments table (nullable - for "Any available" option)
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "employee_id" text;

-- Add foreign key constraint for employee_id in appointments
ALTER TABLE "appointments"
    ADD CONSTRAINT "appointments_employee_id_fkey"
    FOREIGN KEY ("employee_id") REFERENCES "employees"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Create index for employee_id in appointments
CREATE INDEX IF NOT EXISTS "appointments_employee_id_idx" ON "appointments" USING btree ("employee_id");

-- Add reassignment_note column to appointments (for tracking reassigned appointments from deleted employees)
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "reassignment_note" text;
