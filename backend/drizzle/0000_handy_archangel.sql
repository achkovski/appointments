-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TYPE "public"."AppointmentStatus" AS ENUM('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');--> statement-breakpoint
CREATE TYPE "public"."CapacityMode" AS ENUM('SINGLE', 'MULTIPLE');--> statement-breakpoint
CREATE TYPE "public"."NotificationStatus" AS ENUM('PENDING', 'SENT', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."NotificationType" AS ENUM('BOOKING_CONFIRMATION', 'REMINDER', 'CANCELLATION', 'RESCHEDULE', 'BUSINESS_ALERT', 'EMAIL_VERIFICATION');--> statement-breakpoint
CREATE TYPE "public"."UserRole" AS ENUM('ADMIN', 'BUSINESS', 'CLIENT');--> statement-breakpoint
CREATE TABLE "_prisma_migrations" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"checksum" varchar(64) NOT NULL,
	"finished_at" timestamp with time zone,
	"migration_name" varchar(255) NOT NULL,
	"logs" text,
	"rolled_back_at" timestamp with time zone,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"applied_steps_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"role" "UserRole" DEFAULT 'BUSINESS' NOT NULL,
	"phone" text,
	"email_verified" boolean DEFAULT false NOT NULL,
	"email_verification_token" text,
	"reset_password_token" text,
	"reset_password_expires" timestamp(3),
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "businesses" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"business_name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"address" text,
	"phone" text,
	"email" text,
	"website" text,
	"business_type" text,
	"qr_code_url" text,
	"capacity_mode" "CapacityMode" DEFAULT 'SINGLE' NOT NULL,
	"default_capacity" integer DEFAULT 1,
	"default_slot_interval" integer DEFAULT 15 NOT NULL,
	"auto_confirm" boolean DEFAULT true NOT NULL,
	"require_email_confirmation" boolean DEFAULT false NOT NULL,
	"settings" jsonb,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" text PRIMARY KEY NOT NULL,
	"business_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"duration" integer NOT NULL,
	"price" numeric(10, 2),
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" text PRIMARY KEY NOT NULL,
	"business_id" text NOT NULL,
	"service_id" text NOT NULL,
	"client_user_id" text,
	"client_first_name" text NOT NULL,
	"client_last_name" text NOT NULL,
	"client_email" text NOT NULL,
	"client_phone" text NOT NULL,
	"appointment_date" date NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"status" "AppointmentStatus" DEFAULT 'PENDING' NOT NULL,
	"is_email_confirmed" boolean DEFAULT false NOT NULL,
	"email_confirmation_token" text,
	"notes" text,
	"client_notes" text,
	"cancellation_reason" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "availability" (
	"id" text PRIMARY KEY NOT NULL,
	"business_id" text NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"capacity_override" integer,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "breaks" (
	"id" text PRIMARY KEY NOT NULL,
	"availability_id" text NOT NULL,
	"break_start" time NOT NULL,
	"break_end" time NOT NULL,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "special_dates" (
	"id" text PRIMARY KEY NOT NULL,
	"business_id" text NOT NULL,
	"date" date NOT NULL,
	"is_available" boolean DEFAULT false NOT NULL,
	"start_time" time,
	"end_time" time,
	"capacity_override" integer,
	"reason" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"appointment_id" text,
	"recipient_email" text NOT NULL,
	"notification_type" "NotificationType" NOT NULL,
	"status" "NotificationStatus" DEFAULT 'PENDING' NOT NULL,
	"scheduled_for" timestamp(3),
	"sent_at" timestamp(3),
	"error_message" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics" (
	"id" text PRIMARY KEY NOT NULL,
	"business_id" text NOT NULL,
	"date" date NOT NULL,
	"total_appointments" integer DEFAULT 0 NOT NULL,
	"confirmed_appointments" integer DEFAULT 0 NOT NULL,
	"cancelled_appointments" integer DEFAULT 0 NOT NULL,
	"no_shows" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_client_user_id_fkey" FOREIGN KEY ("client_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "availability" ADD CONSTRAINT "availability_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "breaks" ADD CONSTRAINT "breaks_availability_id_fkey" FOREIGN KEY ("availability_id") REFERENCES "public"."availability"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "special_dates" ADD CONSTRAINT "special_dates_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "analytics" ADD CONSTRAINT "analytics_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_key" ON "users" USING btree ("email" text_ops);--> statement-breakpoint
CREATE INDEX "businesses_owner_id_idx" ON "businesses" USING btree ("owner_id" text_ops);--> statement-breakpoint
CREATE INDEX "businesses_slug_idx" ON "businesses" USING btree ("slug" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "businesses_slug_key" ON "businesses" USING btree ("slug" text_ops);--> statement-breakpoint
CREATE INDEX "services_business_id_idx" ON "services" USING btree ("business_id" text_ops);--> statement-breakpoint
CREATE INDEX "services_business_id_is_active_idx" ON "services" USING btree ("business_id" text_ops,"is_active" text_ops);--> statement-breakpoint
CREATE INDEX "appointments_appointment_date_idx" ON "appointments" USING btree ("appointment_date" date_ops);--> statement-breakpoint
CREATE INDEX "appointments_business_id_idx" ON "appointments" USING btree ("business_id" text_ops);--> statement-breakpoint
CREATE INDEX "appointments_client_user_id_idx" ON "appointments" USING btree ("client_user_id" text_ops);--> statement-breakpoint
CREATE INDEX "appointments_service_id_idx" ON "appointments" USING btree ("service_id" text_ops);--> statement-breakpoint
CREATE INDEX "appointments_status_idx" ON "appointments" USING btree ("status" enum_ops);--> statement-breakpoint
CREATE INDEX "availability_business_id_day_of_week_idx" ON "availability" USING btree ("business_id" int4_ops,"day_of_week" int4_ops);--> statement-breakpoint
CREATE INDEX "availability_business_id_idx" ON "availability" USING btree ("business_id" text_ops);--> statement-breakpoint
CREATE INDEX "breaks_availability_id_idx" ON "breaks" USING btree ("availability_id" text_ops);--> statement-breakpoint
CREATE INDEX "special_dates_business_id_date_idx" ON "special_dates" USING btree ("business_id" date_ops,"date" date_ops);--> statement-breakpoint
CREATE INDEX "special_dates_business_id_idx" ON "special_dates" USING btree ("business_id" text_ops);--> statement-breakpoint
CREATE INDEX "notifications_appointment_id_idx" ON "notifications" USING btree ("appointment_id" text_ops);--> statement-breakpoint
CREATE INDEX "notifications_scheduled_for_idx" ON "notifications" USING btree ("scheduled_for" timestamp_ops);--> statement-breakpoint
CREATE INDEX "notifications_status_idx" ON "notifications" USING btree ("status" enum_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "analytics_business_id_date_key" ON "analytics" USING btree ("business_id" date_ops,"date" text_ops);--> statement-breakpoint
CREATE INDEX "analytics_business_id_idx" ON "analytics" USING btree ("business_id" text_ops);--> statement-breakpoint
CREATE INDEX "analytics_date_idx" ON "analytics" USING btree ("date" date_ops);
*/