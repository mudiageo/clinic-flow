/**
 * SQLite Schema (libsql / local master server)
 *
 * This is a 1:1 mirror of schema.ts adapted for SQLite via drizzle-orm/sqlite-core.
 * Key differences from PostgreSQL:
 *   - pgTable       → sqliteTable
 *   - pgEnum        → plain text() columns (SQLite has no native enums)
 *   - uuid()        → text() (SQLite stores UUIDs as text)
 *   - boolean()     → integer({ mode: 'boolean' })
 *   - timestamp()   → integer({ mode: 'timestamp' })
 *   - defaultRandom() → .$defaultFn(() => crypto.randomUUID())
 */
import {
	sqliteTable,
	text,
	integer,
	real,
	index,
	uniqueIndex,
	primaryKey
} from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// ─────────────────────────────────────────────────────────────
// USERS & AUTH
// ─────────────────────────────────────────────────────────────

export const staff = sqliteTable('staff', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	authUserId: text('auth_user_id').notNull().unique(),
	fullName: text('full_name').notNull(),
	role: text('role', { enum: ['receptionist', 'nurse', 'doctor', 'pharmacy', 'admin', 'superadmin'] }).notNull(),
	phcId: text('phc_id').notNull().references(() => phcs.id),
	active: integer('active', { mode: 'boolean' }).notNull().default(true),
	preferences: text('preferences'),
	pin: text('pin'), // argon2-hashed 4-digit PIN for kiosk login
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
});

export const phcs = sqliteTable('phcs', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	name: text('name').notNull(),
	lga: text('lga').notNull(),
	state: text('state').notNull(),
	termiiApiKey: text('termii_api_key'),
	syncPollInterval: integer('sync_poll_interval').notNull().default(30),
	maternalHealthEnabled: integer('maternal_health_enabled', { mode: 'boolean' }).notNull().default(true),
	immunizationEnabled: integer('immunization_enabled', { mode: 'boolean' }).notNull().default(true),
	aiVoiceEnabled: integer('ai_voice_enabled', { mode: 'boolean' }).notNull().default(true),
	outbreakDetectionEnabled: integer('outbreak_detection_enabled', { mode: 'boolean' }).notNull().default(true),
	twoWaySmsEnabled: integer('two_way_sms_enabled', { mode: 'boolean' }).notNull().default(true),
	referralsEnabled: integer('referrals_enabled', { mode: 'boolean' }).notNull().default(true),
	familyHealthEnabled: integer('family_health_enabled', { mode: 'boolean' }).notNull().default(true),
	realTimeNotificationsEnabled: integer('real_time_notifications_enabled', { mode: 'boolean' }).notNull().default(true),
	nhisTrackingEnabled: integer('nhis_tracking_enabled', { mode: 'boolean' }).notNull().default(true),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
});

export const permissions = sqliteTable('permissions', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	staffId: text('staff_id').notNull().references(() => staff.id, { onDelete: 'cascade' }),
	phcId: text('phc_id').notNull().references(() => phcs.id, { onDelete: 'cascade' }),
	permission: text('permission').notNull(),
	grantedBy: text('granted_by').references(() => staff.id),
	grantedAt: integer('granted_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
	expiresAt: integer('expires_at', { mode: 'timestamp' }),
	revoked: integer('revoked', { mode: 'boolean' }).notNull().default(false)
});

// ─────────────────────────────────────────────────────────────
// PATIENTS
// ─────────────────────────────────────────────────────────────

export const families = sqliteTable('families', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	householdName: text('household_name'),
	community: text('community'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
});

export const patients = sqliteTable('patients', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	clinicId: text('clinic_id').notNull(),
	phcId: text('phc_id').notNull().references(() => phcs.id),
	familyId: text('family_id').references(() => families.id),
	guardianId: text('guardian_id'),
	fullName: text('full_name').notNull(),
	phone: text('phone'),
	dob: integer('dob', { mode: 'timestamp' }),
	estimatedAge: integer('estimated_age'),
	sex: text('sex', { enum: ['male', 'female', 'other'] }).notNull(),
	address: text('address'),
	community: text('community'),
	nextOfKinName: text('next_of_kin_name'),
	nextOfKinPhone: text('next_of_kin_phone'),
	isPregnant: integer('is_pregnant', { mode: 'boolean' }).notNull().default(false),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
	deleted: integer('deleted', { mode: 'boolean' }).notNull().default(false)
}, (table) => ({
	clinicIdIdx: uniqueIndex('patients_clinic_id_idx').on(table.phcId, table.clinicId),
	nameIdx: index('patients_name_idx').on(table.fullName),
	phoneIdx: index('patients_phone_idx').on(table.phone)
}));

export const pregnancyRecords = sqliteTable('pregnancy_records', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	patientId: text('patient_id').notNull().references(() => patients.id),
	phcId: text('phc_id').notNull().references(() => phcs.id),
	lmpDate: integer('lmp_date', { mode: 'timestamp' }),
	eddDate: integer('edd_date', { mode: 'timestamp' }),
	status: text('status', { enum: ['active', 'delivered', 'miscarriage', 'transferred'] }).notNull().default('active'),
	gravida: integer('gravida'),
	parity: integer('parity'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
});

export const familyRelationships = sqliteTable('family_relationships', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	patientId: text('patient_id').notNull().references(() => patients.id),
	relatedPatientId: text('related_patient_id').notNull().references(() => patients.id),
	relationship: text('relationship', { enum: ['parent', 'child', 'spouse', 'dependent', 'sibling', 'guardian'] }).notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
}, (table) => ({
	uniquePair: uniqueIndex('family_rel_unique').on(table.patientId, table.relatedPatientId)
}));

// ─────────────────────────────────────────────────────────────
// DEVICES & HARDWARE
// ─────────────────────────────────────────────────────────────

export const devices = sqliteTable('devices', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	phcId: text('phc_id').notNull().references(() => phcs.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	macAddress: text('mac_address'),
	role: text('role', { enum: ['kiosk', 'triage', 'doctor_tablet', 'pharmacy_terminal'] }).notNull().default('kiosk'),
	status: text('status', { enum: ['pending', 'approved', 'revoked'] }).notNull().default('pending'),
	lastSyncAt: integer('last_sync_at', { mode: 'timestamp' }),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
});

// ─────────────────────────────────────────────────────────────
// ENCOUNTERS & CLINICAL
// ─────────────────────────────────────────────────────────────

export const encounters = sqliteTable('encounters', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	patientId: text('patient_id').notNull().references(() => patients.id),
	phcId: text('phc_id').notNull().references(() => phcs.id),
	recordedByStaffId: text('recorded_by_staff_id').references(() => staff.id),
	chiefComplaint: text('chief_complaint'),
	chiefComplaintRaw: text('chief_complaint_raw'),
	chiefComplaintLanguage: text('chief_complaint_language'),
	doctorNotes: text('doctor_notes'),
	visitDate: integer('visit_date', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
}, (table) => ({
	patientIdx: index('encounters_patient_idx').on(table.patientId),
	visitDateIdx: index('encounters_visit_date_idx').on(table.visitDate)
}));

export const vitalsRecords = sqliteTable('vitals_records', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	encounterId: text('encounter_id').notNull().references(() => encounters.id),
	patientId: text('patient_id').notNull().references(() => patients.id),
	temperatureCelsius: real('temperature_celsius'),
	systolicBp: integer('systolic_bp'),
	diastolicBp: integer('diastolic_bp'),
	pulseBpm: integer('pulse_bpm'),
	weightKg: real('weight_kg'),
	spo2Percent: integer('spo2_percent'),
	triageLevel: text('triage_level', { enum: ['unassigned', 'green', 'amber', 'red'] }).notNull().default('green'),
	triageReason: text('triage_reason'),
	recordedAt: integer('recorded_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
}, (table) => ({
	patientIdx: index('vitals_patient_idx').on(table.patientId),
	encIdx: index('vitals_encounter_idx').on(table.encounterId)
}));

export const triageRules = sqliteTable('triage_rules', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	phcId: text('phc_id').notNull().references(() => phcs.id),
	field: text('field').notNull(),
	operator: text('operator').notNull(),
	threshold: real('threshold').notNull(),
	resultingLevel: text('resulting_level', { enum: ['unassigned', 'green', 'amber', 'red'] }).notNull(),
	reasonTemplate: text('reason_template').notNull(),
	requiresPregnant: integer('requires_pregnant', { mode: 'boolean' }).notNull().default(false),
	active: integer('active', { mode: 'boolean' }).notNull().default(true),
	version: integer('version').notNull().default(1)
});

// ─────────────────────────────────────────────────────────────
// LAB REQUESTS
// ─────────────────────────────────────────────────────────────

export const labRequests = sqliteTable('lab_requests', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	encounterId: text('encounter_id').notNull().references(() => encounters.id),
	patientId: text('patient_id').notNull().references(() => patients.id),
	phcId: text('phc_id').notNull().references(() => phcs.id),
	requestedByStaffId: text('requested_by_staff_id').notNull().references(() => staff.id),
	testType: text('test_type').notNull(),
	urgency: text('urgency', { enum: ['routine', 'urgent', 'stat'] }).notNull().default('routine'),
	notes: text('notes'),
	status: text('status', { enum: ['pending', 'processing', 'completed'] }).notNull().default('pending'),
	result: text('result'),
	resultEnteredByStaffId: text('result_entered_by_staff_id').references(() => staff.id),
	resultEnteredAt: integer('result_entered_at', { mode: 'timestamp' }),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
});

// ─────────────────────────────────────────────────────────────
// QUEUE
// ─────────────────────────────────────────────────────────────

export const queueTickets = sqliteTable('queue_tickets', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	patientId: text('patient_id').notNull().references(() => patients.id),
	phcId: text('phc_id').notNull().references(() => phcs.id),
	encounterId: text('encounter_id').references(() => encounters.id),
	ticketNumber: integer('ticket_number').notNull(),
	status: text('status', { enum: ['waiting', 'called', 'in_progress', 'done', 'no_show'] }).notNull().default('waiting'),
	triageLevel: text('triage_level', { enum: ['unassigned', 'green', 'amber', 'red'] }).notNull().default('green'),
	triageReason: text('triage_reason'),
	calledAt: integer('called_at', { mode: 'timestamp' }),
	completedAt: integer('completed_at', { mode: 'timestamp' }),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
}, (table) => ({
	statusIdx: index('queue_status_idx').on(table.status),
	phcDateIdx: index('queue_phc_date_idx').on(table.phcId, table.createdAt)
}));

// ─────────────────────────────────────────────────────────────
// PHARMACY
// ─────────────────────────────────────────────────────────────

export const pharmacyInventory = sqliteTable('pharmacy_inventory', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	phcId: text('phc_id').notNull().references(() => phcs.id),
	itemName: text('item_name').notNull(),
	category: text('category'),
	unit: text('unit').notNull(),
	currentStock: integer('current_stock').notNull().default(0),
	lowStockThreshold: integer('low_stock_threshold').notNull().default(10),
	isCritical: integer('is_critical', { mode: 'boolean' }).notNull().default(false),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
});

export const prescriptions = sqliteTable('prescriptions', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	encounterId: text('encounter_id').notNull().references(() => encounters.id),
	patientId: text('patient_id').notNull().references(() => patients.id),
	inventoryItemId: text('inventory_item_id').notNull().references(() => pharmacyInventory.id),
	quantity: integer('quantity').notNull(),
	dosageInstructions: text('dosage_instructions'),
	dispensed: integer('dispensed', { mode: 'boolean' }).notNull().default(false),
	dispensedAt: integer('dispensed_at', { mode: 'timestamp' }),
	dispensedByStaffId: text('dispensed_by_staff_id').references(() => staff.id),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
});

export const restockRequests = sqliteTable('restock_requests', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	inventoryItemId: text('inventory_item_id').notNull().references(() => pharmacyInventory.id),
	phcId: text('phc_id').notNull().references(() => phcs.id),
	requestedByStaffId: text('requested_by_staff_id').references(() => staff.id),
	quantityRequested: integer('quantity_requested').notNull(),
	status: text('status').notNull().default('pending'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
});

// ─────────────────────────────────────────────────────────────
// SMS REMINDERS
// ─────────────────────────────────────────────────────────────

export const reminders = sqliteTable('reminders', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	patientId: text('patient_id').notNull().references(() => patients.id),
	phcId: text('phc_id').notNull().references(() => phcs.id),
	type: text('type', { enum: ['immunization', 'antenatal', 'follow_up'] }).notNull(),
	label: text('label').notNull(),
	dueDate: integer('due_date', { mode: 'timestamp' }).notNull(),
	recipientPhone: text('recipient_phone').notNull(),
	status: text('status', { enum: ['scheduled', 'sent', 'failed', 'cancelled'] }).notNull().default('scheduled'),
	sentAt: integer('sent_at', { mode: 'timestamp' }),
	provider: text('provider'),
	providerMessageId: text('provider_message_id'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
});

export const smsInbox = sqliteTable('sms_inbox', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	phcId: text('phc_id').references(() => phcs.id),
	patientId: text('patient_id').references(() => patients.id),
	fromPhone: text('from_phone').notNull(),
	toPhone: text('to_phone'),
	message: text('message').notNull(),
	providerMessageId: text('provider_message_id'),
	isRead: integer('is_read', { mode: 'boolean' }).notNull().default(false),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
});

// ─────────────────────────────────────────────────────────────
// APPOINTMENTS
// ─────────────────────────────────────────────────────────────

export const appointments = sqliteTable('appointments', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	patientId: text('patient_id').notNull().references(() => patients.id),
	phcId: text('phc_id').notNull().references(() => phcs.id),
	assignedStaffId: text('assigned_staff_id').references(() => staff.id),
	type: text('type', { enum: ['antenatal', 'immunization', 'follow-up', 'general', 'lab-follow-up'] }).notNull(),
	scheduledAt: integer('scheduled_at', { mode: 'timestamp' }).notNull(),
	durationMinutes: integer('duration_minutes').notNull().default(30),
	notes: text('notes'),
	status: text('status', { enum: ['scheduled', 'completed', 'cancelled', 'no-show'] }).notNull().default('scheduled'),
	smsReminderSent: integer('sms_reminder_sent', { mode: 'boolean' }).notNull().default(false),
	isConfirmed: integer('is_confirmed', { mode: 'boolean' }).notNull().default(false),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
});

// ─────────────────────────────────────────────────────────────
// SYNC INFRASTRUCTURE
// ─────────────────────────────────────────────────────────────

export const syncOperations = sqliteTable('sync_operations', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	phcId: text('phc_id').notNull().references(() => phcs.id),
	deviceId: text('device_id').notNull(),
	entityType: text('entity_type').notNull(),
	entityId: text('entity_id').notNull(),
	operation: text('operation').notNull(),
	payload: text('payload').notNull(),
	clientUpdatedAt: integer('client_updated_at', { mode: 'timestamp' }).notNull(),
	serverReceivedAt: integer('server_received_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
});

// ─────────────────────────────────────────────────────────────
// AUDIT LOG
// ─────────────────────────────────────────────────────────────

export const auditLog = sqliteTable('audit_log', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	phcId: text('phc_id').notNull().references(() => phcs.id, { onDelete: 'cascade' }),
	staffId: text('staff_id').references(() => staff.id, { onDelete: 'set null' }),
	action: text('action').notNull(),
	entityType: text('entity_type'),
	entityId: text('entity_id'),
	metadata: text('metadata'),
	ip: text('ip'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
}, (table) => ({
	phcIdx: index('audit_log_phc_idx').on(table.phcId),
	createdAtIdx: index('audit_log_created_at_idx').on(table.createdAt)
}));

// ─────────────────────────────────────────────────────────────
// RELATIONS (same as pg schema)
// ─────────────────────────────────────────────────────────────

export const staffRelations = relations(staff, ({ one, many }) => ({
	phc: one(phcs, { fields: [staff.phcId], references: [phcs.id] }),
	permissions: many(permissions),
	encounters: many(encounters),
	auditEntries: many(auditLog)
}));

export const phcsRelations = relations(phcs, ({ many }) => ({
	staff: many(staff),
	patients: many(patients),
	devices: many(devices)
}));

export const patientsRelations = relations(patients, ({ one, many }) => ({
	phc: one(phcs, { fields: [patients.phcId], references: [phcs.id] }),
	family: one(families, { fields: [patients.familyId], references: [families.id] }),
	queueTickets: many(queueTickets),
	encounters: many(encounters),
	vitalsRecords: many(vitalsRecords),
	reminders: many(reminders),
	pregnancyRecords: many(pregnancyRecords),
	appointments: many(appointments)
}));

export const encountersRelations = relations(encounters, ({ one, many }) => ({
	patient: one(patients, { fields: [encounters.patientId], references: [patients.id] }),
	phc: one(phcs, { fields: [encounters.phcId], references: [phcs.id] }),
	vitalsRecords: many(vitalsRecords),
	labRequests: many(labRequests),
	prescriptions: many(prescriptions)
}));

export const queueTicketsRelations = relations(queueTickets, ({ one }) => ({
	patient: one(patients, { fields: [queueTickets.patientId], references: [patients.id] }),
	phc: one(phcs, { fields: [queueTickets.phcId], references: [phcs.id] })
}));

export const auditLogRelations = relations(auditLog, ({ one }) => ({
	phc: one(phcs, { fields: [auditLog.phcId], references: [phcs.id] }),
	staff: one(staff, { fields: [auditLog.staffId], references: [staff.id] })
}));
