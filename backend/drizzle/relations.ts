import { relations } from "drizzle-orm/relations";
import { users, businesses, services, appointments, availability, breaks, specialDates, notifications, analytics, employees, employeeServices, employeeAvailability, employeeBreaks, employeeSpecialDates } from "./schema";

export const businessesRelations = relations(businesses, ({one, many}) => ({
	user: one(users, {
		fields: [businesses.ownerId],
		references: [users.id]
	}),
	services: many(services),
	appointments: many(appointments),
	availabilities: many(availability),
	specialDates: many(specialDates),
	analytics: many(analytics),
	employees: many(employees),
}));

export const usersRelations = relations(users, ({many}) => ({
	businesses: many(businesses),
	appointments: many(appointments),
}));

export const servicesRelations = relations(services, ({one, many}) => ({
	business: one(businesses, {
		fields: [services.businessId],
		references: [businesses.id]
	}),
	appointments: many(appointments),
	employeeServices: many(employeeServices),
}));

export const appointmentsRelations = relations(appointments, ({one, many}) => ({
	business: one(businesses, {
		fields: [appointments.businessId],
		references: [businesses.id]
	}),
	service: one(services, {
		fields: [appointments.serviceId],
		references: [services.id]
	}),
	user: one(users, {
		fields: [appointments.clientUserId],
		references: [users.id]
	}),
	employee: one(employees, {
		fields: [appointments.employeeId],
		references: [employees.id]
	}),
	notifications: many(notifications),
}));

export const availabilityRelations = relations(availability, ({one, many}) => ({
	business: one(businesses, {
		fields: [availability.businessId],
		references: [businesses.id]
	}),
	breaks: many(breaks),
}));

export const breaksRelations = relations(breaks, ({one}) => ({
	availability: one(availability, {
		fields: [breaks.availabilityId],
		references: [availability.id]
	}),
}));

export const specialDatesRelations = relations(specialDates, ({one}) => ({
	business: one(businesses, {
		fields: [specialDates.businessId],
		references: [businesses.id]
	}),
}));

export const notificationsRelations = relations(notifications, ({one}) => ({
	appointment: one(appointments, {
		fields: [notifications.appointmentId],
		references: [appointments.id]
	}),
}));

export const analyticsRelations = relations(analytics, ({one}) => ({
	business: one(businesses, {
		fields: [analytics.businessId],
		references: [businesses.id]
	}),
}));

// Employee relations
export const employeesRelations = relations(employees, ({one, many}) => ({
	business: one(businesses, {
		fields: [employees.businessId],
		references: [businesses.id]
	}),
	employeeServices: many(employeeServices),
	employeeAvailability: many(employeeAvailability),
	employeeSpecialDates: many(employeeSpecialDates),
	appointments: many(appointments),
}));

export const employeeServicesRelations = relations(employeeServices, ({one}) => ({
	employee: one(employees, {
		fields: [employeeServices.employeeId],
		references: [employees.id]
	}),
	service: one(services, {
		fields: [employeeServices.serviceId],
		references: [services.id]
	}),
}));

export const employeeAvailabilityRelations = relations(employeeAvailability, ({one, many}) => ({
	employee: one(employees, {
		fields: [employeeAvailability.employeeId],
		references: [employees.id]
	}),
	breaks: many(employeeBreaks),
}));

export const employeeBreaksRelations = relations(employeeBreaks, ({one}) => ({
	employeeAvailability: one(employeeAvailability, {
		fields: [employeeBreaks.employeeAvailabilityId],
		references: [employeeAvailability.id]
	}),
}));

export const employeeSpecialDatesRelations = relations(employeeSpecialDates, ({one}) => ({
	employee: one(employees, {
		fields: [employeeSpecialDates.employeeId],
		references: [employees.id]
	}),
}));