import { pgTable, varchar, timestamp, text, integer, uniqueIndex, boolean, index, foreignKey, jsonb, numeric, date, time, pgEnum } from "drizzle-orm/pg-core"
import { sql, relations } from "drizzle-orm"

export const appointmentStatus = pgEnum("AppointmentStatus", ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'])
export const capacityMode = pgEnum("CapacityMode", ['SINGLE', 'MULTIPLE'])
export const notificationStatus = pgEnum("NotificationStatus", ['PENDING', 'SENT', 'FAILED'])
export const notificationType = pgEnum("NotificationType", ['BOOKING_CONFIRMATION', 'REMINDER', 'CANCELLATION', 'RESCHEDULE', 'BUSINESS_ALERT', 'EMAIL_VERIFICATION'])
export const userRole = pgEnum("UserRole", ['ADMIN', 'BUSINESS', 'CLIENT'])


export const prismaMigrations = pgTable("_prisma_migrations", {
	id: varchar({ length: 36 }).primaryKey().notNull(),
	checksum: varchar({ length: 64 }).notNull(),
	finishedAt: timestamp("finished_at", { withTimezone: true, mode: 'string' }),
	migrationName: varchar("migration_name", { length: 255 }).notNull(),
	logs: text(),
	rolledBackAt: timestamp("rolled_back_at", { withTimezone: true, mode: 'string' }),
	startedAt: timestamp("started_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	appliedStepsCount: integer("applied_steps_count").default(0).notNull(),
});

export const users = pgTable("users", {
	id: text().primaryKey().notNull(),
	email: text().notNull(),
	passwordHash: text("password_hash").notNull(),
	firstName: text("first_name").notNull(),
	lastName: text("last_name").notNull(),
	role: userRole().default('BUSINESS').notNull(),
	phone: text(),
	emailVerified: boolean("email_verified").default(false).notNull(),
	emailVerificationToken: text("email_verification_token"),
	resetPasswordToken: text("reset_password_token"),
	resetPasswordExpires: timestamp("reset_password_expires", { precision: 3, mode: 'string' }),
	hasCompletedSetup: boolean("has_completed_setup").default(false).notNull(),
	settings: jsonb(),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	uniqueIndex("users_email_key").using("btree", table.email.asc().nullsLast().op("text_ops")),
]);

export const businesses = pgTable("businesses", {
	id: text().primaryKey().notNull(),
	ownerId: text("owner_id").notNull(),
	businessName: text("business_name").notNull(),
	slug: text().notNull(),
	description: text(),
	address: text(),
	city: text(),
	country: text().default('north_macedonia'),
	phone: text(),
	email: text(),
	website: text(),
	businessType: text("business_type"),
	qrCodeUrl: text("qr_code_url"),
	capacityMode: capacityMode("capacity_mode").default('SINGLE').notNull(),
	defaultCapacity: integer("default_capacity").default(1),
	defaultSlotInterval: integer("default_slot_interval").default(15).notNull(),
	autoConfirm: boolean("auto_confirm").default(true).notNull(),
	requireEmailConfirmation: boolean("require_email_confirmation").default(false).notNull(),
	settings: jsonb(),
	timezone: text().default('Europe/Skopje').notNull(),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	index("businesses_owner_id_idx").using("btree", table.ownerId.asc().nullsLast().op("text_ops")),
	index("businesses_slug_idx").using("btree", table.slug.asc().nullsLast().op("text_ops")),
	uniqueIndex("businesses_slug_key").using("btree", table.slug.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.ownerId],
			foreignColumns: [users.id],
			name: "businesses_owner_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const services = pgTable("services", {
	id: text().primaryKey().notNull(),
	businessId: text("business_id").notNull(),
	name: text().notNull(),
	description: text(),
	duration: integer().notNull(),
	price: numeric({ precision: 10, scale:  2 }),
	isActive: boolean("is_active").default(true).notNull(),
	displayOrder: integer("display_order").default(0).notNull(),
	customCapacity: integer("custom_capacity"),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	index("services_business_id_idx").using("btree", table.businessId.asc().nullsLast().op("text_ops")),
	index("services_business_id_is_active_idx").using("btree", table.businessId.asc().nullsLast().op("text_ops"), table.isActive.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.businessId],
			foreignColumns: [businesses.id],
			name: "services_business_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const appointments = pgTable("appointments", {
	id: text().primaryKey().notNull(),
	businessId: text("business_id").notNull(),
	serviceId: text("service_id").notNull(),
	employeeId: text("employee_id"),
	clientUserId: text("client_user_id"),
	clientFirstName: text("client_first_name").notNull(),
	clientLastName: text("client_last_name").notNull(),
	clientEmail: text("client_email").notNull(),
	clientPhone: text("client_phone").notNull(),
	appointmentDate: date("appointment_date").notNull(),
	startTime: time("start_time").notNull(),
	endTime: time("end_time").notNull(),
	status: appointmentStatus().default('PENDING').notNull(),
	isEmailConfirmed: boolean("is_email_confirmed").default(false).notNull(),
	emailConfirmationToken: text("email_confirmation_token"),
	notes: text(),
	clientNotes: text("client_notes"),
	cancellationReason: text("cancellation_reason"),
	reassignmentNote: text("reassignment_note"),
	completedAutomatically: boolean("completed_automatically").default(false).notNull(),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	index("appointments_appointment_date_idx").using("btree", table.appointmentDate.asc().nullsLast().op("date_ops")),
	index("appointments_business_id_idx").using("btree", table.businessId.asc().nullsLast().op("text_ops")),
	index("appointments_client_user_id_idx").using("btree", table.clientUserId.asc().nullsLast().op("text_ops")),
	index("appointments_service_id_idx").using("btree", table.serviceId.asc().nullsLast().op("text_ops")),
	index("appointments_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("appointments_employee_id_idx").using("btree", table.employeeId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.businessId],
			foreignColumns: [businesses.id],
			name: "appointments_business_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.serviceId],
			foreignColumns: [services.id],
			name: "appointments_service_id_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	foreignKey({
			columns: [table.clientUserId],
			foreignColumns: [users.id],
			name: "appointments_client_user_id_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const availability = pgTable("availability", {
	id: text().primaryKey().notNull(),
	businessId: text("business_id").notNull(),
	dayOfWeek: integer("day_of_week").notNull(),
	startTime: time("start_time").notNull(),
	endTime: time("end_time").notNull(),
	isAvailable: boolean("is_available").default(true).notNull(),
	capacityOverride: integer("capacity_override"),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	index("availability_business_id_day_of_week_idx").using("btree", table.businessId.asc().nullsLast().op("int4_ops"), table.dayOfWeek.asc().nullsLast().op("int4_ops")),
	index("availability_business_id_idx").using("btree", table.businessId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.businessId],
			foreignColumns: [businesses.id],
			name: "availability_business_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const breaks = pgTable("breaks", {
	id: text().primaryKey().notNull(),
	availabilityId: text("availability_id").notNull(),
	breakStart: time("break_start").notNull(),
	breakEnd: time("break_end").notNull(),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("breaks_availability_id_idx").using("btree", table.availabilityId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.availabilityId],
			foreignColumns: [availability.id],
			name: "breaks_availability_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const specialDates = pgTable("special_dates", {
	id: text().primaryKey().notNull(),
	businessId: text("business_id").notNull(),
	date: date().notNull(),
	isAvailable: boolean("is_available").default(false).notNull(),
	startTime: time("start_time"),
	endTime: time("end_time"),
	capacityOverride: integer("capacity_override"),
	reason: text(),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("special_dates_business_id_date_idx").using("btree", table.businessId.asc().nullsLast().op("date_ops"), table.date.asc().nullsLast().op("date_ops")),
	index("special_dates_business_id_idx").using("btree", table.businessId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.businessId],
			foreignColumns: [businesses.id],
			name: "special_dates_business_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const notifications = pgTable("notifications", {
	id: text().primaryKey().notNull(),
	appointmentId: text("appointment_id"),
	recipientEmail: text("recipient_email").notNull(),
	notificationType: notificationType("notification_type").notNull(),
	status: notificationStatus().default('PENDING').notNull(),
	scheduledFor: timestamp("scheduled_for", { precision: 3, mode: 'string' }),
	sentAt: timestamp("sent_at", { precision: 3, mode: 'string' }),
	errorMessage: text("error_message"),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("notifications_appointment_id_idx").using("btree", table.appointmentId.asc().nullsLast().op("text_ops")),
	index("notifications_scheduled_for_idx").using("btree", table.scheduledFor.asc().nullsLast().op("timestamp_ops")),
	index("notifications_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.appointmentId],
			foreignColumns: [appointments.id],
			name: "notifications_appointment_id_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const analytics = pgTable("analytics", {
	id: text().primaryKey().notNull(),
	businessId: text("business_id").notNull(),
	date: date().notNull(),
	totalAppointments: integer("total_appointments").default(0).notNull(),
	confirmedAppointments: integer("confirmed_appointments").default(0).notNull(),
	cancelledAppointments: integer("cancelled_appointments").default(0).notNull(),
	noShows: integer("no_shows").default(0).notNull(),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	uniqueIndex("analytics_business_id_date_key").using("btree", table.businessId.asc().nullsLast().op("date_ops"), table.date.asc().nullsLast().op("text_ops")),
	index("analytics_business_id_idx").using("btree", table.businessId.asc().nullsLast().op("text_ops")),
	index("analytics_date_idx").using("btree", table.date.asc().nullsLast().op("date_ops")),
	foreignKey({
			columns: [table.businessId],
			foreignColumns: [businesses.id],
			name: "analytics_business_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

// Employees table
export const employees = pgTable("employees", {
	id: text().primaryKey().notNull(),
	businessId: text("business_id").notNull(),
	name: text().notNull(),
	email: text(),
	phone: text(),
	useBusinessEmail: boolean("use_business_email").default(false).notNull(),
	useBusinessPhone: boolean("use_business_phone").default(false).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	maxDailyAppointments: integer("max_daily_appointments").default(0),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	index("employees_business_id_idx").using("btree", table.businessId.asc().nullsLast().op("text_ops")),
	index("employees_business_id_is_active_idx").using("btree", table.businessId.asc().nullsLast().op("text_ops"), table.isActive.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.businessId],
			foreignColumns: [businesses.id],
			name: "employees_business_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

// Employee-Service junction table (many-to-many)
export const employeeServices = pgTable("employee_services", {
	id: text().primaryKey().notNull(),
	employeeId: text("employee_id").notNull(),
	serviceId: text("service_id").notNull(),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	uniqueIndex("employee_services_employee_id_service_id_key").using("btree", table.employeeId.asc().nullsLast().op("text_ops"), table.serviceId.asc().nullsLast().op("text_ops")),
	index("employee_services_employee_id_idx").using("btree", table.employeeId.asc().nullsLast().op("text_ops")),
	index("employee_services_service_id_idx").using("btree", table.serviceId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.employeeId],
			foreignColumns: [employees.id],
			name: "employee_services_employee_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.serviceId],
			foreignColumns: [services.id],
			name: "employee_services_service_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

// Employee availability (working hours per day)
export const employeeAvailability = pgTable("employee_availability", {
	id: text().primaryKey().notNull(),
	employeeId: text("employee_id").notNull(),
	dayOfWeek: integer("day_of_week").notNull(),
	startTime: time("start_time").notNull(),
	endTime: time("end_time").notNull(),
	isAvailable: boolean("is_available").default(true).notNull(),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).notNull(),
}, (table) => [
	index("employee_availability_employee_id_idx").using("btree", table.employeeId.asc().nullsLast().op("text_ops")),
	index("employee_availability_employee_id_day_of_week_idx").using("btree", table.employeeId.asc().nullsLast().op("int4_ops"), table.dayOfWeek.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.employeeId],
			foreignColumns: [employees.id],
			name: "employee_availability_employee_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

// Employee breaks
export const employeeBreaks = pgTable("employee_breaks", {
	id: text().primaryKey().notNull(),
	employeeAvailabilityId: text("employee_availability_id").notNull(),
	breakStart: time("break_start").notNull(),
	breakEnd: time("break_end").notNull(),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("employee_breaks_employee_availability_id_idx").using("btree", table.employeeAvailabilityId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.employeeAvailabilityId],
			foreignColumns: [employeeAvailability.id],
			name: "employee_breaks_employee_availability_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

// Employee special dates (exceptions)
export const employeeSpecialDates = pgTable("employee_special_dates", {
	id: text().primaryKey().notNull(),
	employeeId: text("employee_id").notNull(),
	date: date().notNull(),
	isAvailable: boolean("is_available").default(false).notNull(),
	startTime: time("start_time"),
	endTime: time("end_time"),
	reason: text(),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("employee_special_dates_employee_id_idx").using("btree", table.employeeId.asc().nullsLast().op("text_ops")),
	index("employee_special_dates_employee_id_date_idx").using("btree", table.employeeId.asc().nullsLast().op("date_ops"), table.date.asc().nullsLast().op("date_ops")),
	foreignKey({
			columns: [table.employeeId],
			foreignColumns: [employees.id],
			name: "employee_special_dates_employee_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

// Define Drizzle relations for query builder

// Employee relations
export const employeesRelations = relations(employees, ({ one, many }) => ({
	business: one(businesses, {
		fields: [employees.businessId],
		references: [businesses.id],
	}),
	employeeServices: many(employeeServices),
	employeeAvailability: many(employeeAvailability),
	employeeSpecialDates: many(employeeSpecialDates),
	appointments: many(appointments),
}));

// Employee Services (junction table) relations
export const employeeServicesRelations = relations(employeeServices, ({ one }) => ({
	employee: one(employees, {
		fields: [employeeServices.employeeId],
		references: [employees.id],
	}),
	service: one(services, {
		fields: [employeeServices.serviceId],
		references: [services.id],
	}),
}));

// Services relations
export const servicesRelations = relations(services, ({ one, many }) => ({
	business: one(businesses, {
		fields: [services.businessId],
		references: [businesses.id],
	}),
	employeeServices: many(employeeServices),
	appointments: many(appointments),
}));

// Businesses relations
export const businessesRelations = relations(businesses, ({ one, many }) => ({
	owner: one(users, {
		fields: [businesses.ownerId],
		references: [users.id],
	}),
	employees: many(employees),
	services: many(services),
	appointments: many(appointments),
	availability: many(availability),
	specialDates: many(specialDates),
}));

// Appointments relations
export const appointmentsRelations = relations(appointments, ({ one }) => ({
	business: one(businesses, {
		fields: [appointments.businessId],
		references: [businesses.id],
	}),
	service: one(services, {
		fields: [appointments.serviceId],
		references: [services.id],
	}),
	employee: one(employees, {
		fields: [appointments.employeeId],
		references: [employees.id],
	}),
	client: one(users, {
		fields: [appointments.clientUserId],
		references: [users.id],
	}),
}));

// Employee Availability relations
export const employeeAvailabilityRelations = relations(employeeAvailability, ({ one, many }) => ({
	employee: one(employees, {
		fields: [employeeAvailability.employeeId],
		references: [employees.id],
	}),
	breaks: many(employeeBreaks),
}));

// Employee Breaks relations
export const employeeBreaksRelations = relations(employeeBreaks, ({ one }) => ({
	employeeAvailability: one(employeeAvailability, {
		fields: [employeeBreaks.employeeAvailabilityId],
		references: [employeeAvailability.id],
	}),
}));

// Employee Special Dates relations
export const employeeSpecialDatesRelations = relations(employeeSpecialDates, ({ one }) => ({
	employee: one(employees, {
		fields: [employeeSpecialDates.employeeId],
		references: [employees.id],
	}),
}));

// Availability relations
export const availabilityRelations = relations(availability, ({ one, many }) => ({
	business: one(businesses, {
		fields: [availability.businessId],
		references: [businesses.id],
	}),
	breaks: many(breaks),
}));

// Breaks relations
export const breaksRelations = relations(breaks, ({ one }) => ({
	availability: one(availability, {
		fields: [breaks.availabilityId],
		references: [availability.id],
	}),
}));

// Special Dates relations
export const specialDatesRelations = relations(specialDates, ({ one }) => ({
	business: one(businesses, {
		fields: [specialDates.businessId],
		references: [businesses.id],
	}),
}));

// Users relations
export const usersRelations = relations(users, ({ many }) => ({
	businesses: many(businesses),
}));
