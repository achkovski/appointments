-- Add employee_id and reassignment_note columns to appointments
ALTER TABLE "appointments" ADD COLUMN "employee_id" TEXT;
ALTER TABLE "appointments" ADD COLUMN "reassignment_note" TEXT;

-- Create index for employee_id in appointments
CREATE INDEX "appointments_employee_id_idx" ON "appointments"("employee_id");

-- CreateTable employees
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "use_business_email" BOOLEAN NOT NULL DEFAULT false,
    "use_business_phone" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "max_daily_appointments" INTEGER DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable employee_services (junction table)
CREATE TABLE "employee_services" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable employee_availability
CREATE TABLE "employee_availability" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "start_time" TIME NOT NULL,
    "end_time" TIME NOT NULL,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable employee_breaks
CREATE TABLE "employee_breaks" (
    "id" TEXT NOT NULL,
    "employee_availability_id" TEXT NOT NULL,
    "break_start" TIME NOT NULL,
    "break_end" TIME NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_breaks_pkey" PRIMARY KEY ("id")
);

-- CreateTable employee_special_dates
CREATE TABLE "employee_special_dates" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "is_available" BOOLEAN NOT NULL DEFAULT false,
    "start_time" TIME,
    "end_time" TIME,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_special_dates_pkey" PRIMARY KEY ("id")
);

-- Create indexes for employees
CREATE INDEX "employees_business_id_idx" ON "employees"("business_id");
CREATE INDEX "employees_business_id_is_active_idx" ON "employees"("business_id", "is_active");

-- Create indexes for employee_services
CREATE UNIQUE INDEX "employee_services_employee_id_service_id_key" ON "employee_services"("employee_id", "service_id");
CREATE INDEX "employee_services_employee_id_idx" ON "employee_services"("employee_id");
CREATE INDEX "employee_services_service_id_idx" ON "employee_services"("service_id");

-- Create indexes for employee_availability
CREATE INDEX "employee_availability_employee_id_idx" ON "employee_availability"("employee_id");
CREATE INDEX "employee_availability_employee_id_day_of_week_idx" ON "employee_availability"("employee_id", "day_of_week");

-- Create indexes for employee_breaks
CREATE INDEX "employee_breaks_employee_availability_id_idx" ON "employee_breaks"("employee_availability_id");

-- Create indexes for employee_special_dates
CREATE INDEX "employee_special_dates_employee_id_idx" ON "employee_special_dates"("employee_id");
CREATE INDEX "employee_special_dates_employee_id_date_idx" ON "employee_special_dates"("employee_id", "date");

-- Add foreign keys
ALTER TABLE "employees" ADD CONSTRAINT "employees_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "employee_services" ADD CONSTRAINT "employee_services_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "employee_services" ADD CONSTRAINT "employee_services_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "employee_availability" ADD CONSTRAINT "employee_availability_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "employee_breaks" ADD CONSTRAINT "employee_breaks_employee_availability_id_fkey" FOREIGN KEY ("employee_availability_id") REFERENCES "employee_availability"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "employee_special_dates" ADD CONSTRAINT "employee_special_dates_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
