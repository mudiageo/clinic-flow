# ClinicFlow — Database & Code Schema Design (Drizzle ORM)

Full `schema.ts` covering all 9 modules: patients, family links, vitals, queue tickets, triage config, pharmacy inventory, prescriptions, reminders, users/roles, and sync log.

```ts
// src/lib/server/db/schema.ts
import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  real,
  boolean,
  timestamp,
  pgEnum,
  index,
  uniqueIndex,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// ─────────────────────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────────────────────

export const sexEnum = pgEnum('sex', ['male', 'female', 'other']);
export const relationshipEnum = pgEnum('relationship_type', [
  'parent', 'child', 'spouse', 'dependent', 'sibling', 'guardian',
]);
export const triageLevelEnum = pgEnum('triage_level', ['green', 'amber', 'red']);
export const ticketStatusEnum = pgEnum('ticket_status', [
  'waiting', 'called', 'in_progress', 'done', 'no_show',
]);
export const userRoleEnum = pgEnum('user_role', [
  'receptionist', 'nurse', 'doctor', 'pharmacy', 'admin',
]);
export const reminderTypeEnum = pgEnum('reminder_type', ['immunization', 'antenatal', 'follow_up']);
export const reminderStatusEnum = pgEnum('reminder_status', ['scheduled', 'sent', 'failed', 'cancelled']);

// ─────────────────────────────────────────────────────────────
// USERS & AUTH (Better Auth compatible core fields kept minimal here;
// Better Auth generates its own users/sessions tables — this extends it)
// ─────────────────────────────────────────────────────────────

export const staff = pgTable('staff', {
  id: uuid('id').primaryKey().defaultRandom(),
  authUserId: text('auth_user_id').notNull().unique(), // FK to Better Auth's user.id
  fullName: varchar('full_name', { length: 120 }).notNull(),
  role: userRoleEnum('role').notNull(),
  phcId: uuid('phc_id').notNull().references(() => phcs.id),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const phcs = pgTable('phcs', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 160 }).notNull(),
  lga: varchar('lga', { length: 120 }).notNull(),
  state: varchar('state', { length: 80 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─────────────────────────────────────────────────────────────
// PATIENTS
// ─────────────────────────────────────────────────────────────

export const families = pgTable('families', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdName: varchar('household_name', { length: 160 }),
  community: varchar('community', { length: 160 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const patients = pgTable('patients', {
  id: uuid('id').primaryKey().defaultRandom(), // matches client-generated UUID
  clinicId: varchar('clinic_id', { length: 20 }).notNull(), // human-readable, QR-encoded
  phcId: uuid('phc_id').notNull().references(() => phcs.id),
  familyId: uuid('family_id').references(() => families.id),
  guardianId: uuid('guardian_id'), // self-reference, set up below via relations
  fullName: varchar('full_name', { length: 160 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  dob: timestamp('dob', { mode: 'date' }),
  estimatedAge: integer('estimated_age'), // used when DOB unknown
  sex: sexEnum('sex').notNull(),
  address: text('address'),
  community: varchar('community', { length: 160 }),
  nextOfKinName: varchar('next_of_kin_name', { length: 160 }),
  nextOfKinPhone: varchar('next_of_kin_phone', { length: 20 }),
  isPregnant: boolean('is_pregnant').notNull().default(false), // drives BP triage rule
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  deleted: boolean('deleted').notNull().default(false),
}, (table) => ({
  clinicIdIdx: uniqueIndex('patients_clinic_id_idx').on(table.phcId, table.clinicId),
  nameIdx: index('patients_name_idx').on(table.fullName),
  phoneIdx: index('patients_phone_idx').on(table.phone),
  familyIdx: index('patients_family_idx').on(table.familyId),
}));

export const familyRelationships = pgTable('family_relationships', {
  id: uuid('id').primaryKey().defaultRandom(),
  patientId: uuid('patient_id').notNull().references(() => patients.id),
  relatedPatientId: uuid('related_patient_id').notNull().references(() => patients.id),
  relationship: relationshipEnum('relationship').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  uniquePair: uniqueIndex('family_rel_unique').on(table.patientId, table.relatedPatientId),
}));

// ─────────────────────────────────────────────────────────────
// VITALS & ENCOUNTERS
// ─────────────────────────────────────────────────────────────

export const encounters = pgTable('encounters', {
  id: uuid('id').primaryKey().defaultRandom(),
  patientId: uuid('patient_id').notNull().references(() => patients.id),
  phcId: uuid('phc_id').notNull().references(() => phcs.id),
  recordedByStaffId: uuid('recorded_by_staff_id').references(() => staff.id),
  chiefComplaint: text('chief_complaint'),
  chiefComplaintRaw: text('chief_complaint_raw'), // raw voice transcript before AI structuring
  chiefComplaintLanguage: varchar('chief_complaint_language', { length: 20 }), // 'english' | 'pidgin'
  doctorNotes: text('doctor_notes'),
  visitDate: timestamp('visit_date', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  patientIdx: index('encounters_patient_idx').on(table.patientId),
  visitDateIdx: index('encounters_visit_date_idx').on(table.visitDate),
}));

export const vitalsRecords = pgTable('vitals_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  encounterId: uuid('encounter_id').notNull().references(() => encounters.id),
  patientId: uuid('patient_id').notNull().references(() => patients.id),
  temperatureCelsius: real('temperature_celsius'),
  systolicBp: integer('systolic_bp'),
  diastolicBp: integer('diastolic_bp'),
  pulseBpm: integer('pulse_bpm'),
  weightKg: real('weight_kg'),
  spo2Percent: integer('spo2_percent'),
  triageLevel: triageLevelEnum('triage_level').notNull().default('green'),
  triageReason: text('triage_reason'), // e.g. "High Fever — 39.4°C"
  recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  patientIdx: index('vitals_patient_idx').on(table.patientId),
  encounterIdx: index('vitals_encounter_idx').on(table.encounterId),
  triageIdx: index('vitals_triage_idx').on(table.triageLevel),
}));

// Versioned, PHC-configurable triage rules (not hardcoded)
export const triageRules = pgTable('triage_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  phcId: uuid('phc_id').notNull().references(() => phcs.id),
  field: varchar('field', { length: 40 }).notNull(), // 'temperatureCelsius' | 'systolicBp' | ...
  operator: varchar('operator', { length: 10 }).notNull(), // 'gte' | 'lte' | 'lt' | 'gt'
  threshold: real('threshold').notNull(),
  resultingLevel: triageLevelEnum('resulting_level').notNull(),
  reasonTemplate: varchar('reason_template', { length: 160 }).notNull(),
  requiresPregnant: boolean('requires_pregnant').notNull().default(false),
  active: boolean('active').notNull().default(true),
  version: integer('version').notNull().default(1),
});

// ─────────────────────────────────────────────────────────────
// QUEUE
// ─────────────────────────────────────────────────────────────

export const queueTickets = pgTable('queue_tickets', {
  id: uuid('id').primaryKey().defaultRandom(),
  patientId: uuid('patient_id').notNull().references(() => patients.id),
  phcId: uuid('phc_id').notNull().references(() => phcs.id),
  encounterId: uuid('encounter_id').references(() => encounters.id),
  ticketNumber: integer('ticket_number').notNull(),
  status: ticketStatusEnum('status').notNull().default('waiting'),
  triageLevel: triageLevelEnum('triage_level').notNull().default('green'),
  triageReason: text('triage_reason'),
  calledAt: timestamp('called_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  statusIdx: index('queue_status_idx').on(table.status),
  triageIdx: index('queue_triage_idx').on(table.triageLevel),
  phcDateIdx: index('queue_phc_date_idx').on(table.phcId, table.createdAt),
  ticketNumUnique: uniqueIndex('queue_ticket_num_unique').on(table.phcId, table.ticketNumber, table.createdAt),
}));

// ─────────────────────────────────────────────────────────────
// PHARMACY
// ─────────────────────────────────────────────────────────────

export const pharmacyInventory = pgTable('pharmacy_inventory', {
  id: uuid('id').primaryKey().defaultRandom(),
  phcId: uuid('phc_id').notNull().references(() => phcs.id),
  itemName: varchar('item_name', { length: 160 }).notNull(),
  category: varchar('category', { length: 60 }), // 'antimalarial' | 'arv' | 'vaccine' | 'family_planning' | 'other'
  unit: varchar('unit', { length: 30 }).notNull(), // 'tablet' | 'vial' | 'dose' | 'sachet'
  currentStock: integer('current_stock').notNull().default(0),
  lowStockThreshold: integer('low_stock_threshold').notNull().default(10),
  isCritical: boolean('is_critical').notNull().default(false),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  phcItemIdx: uniqueIndex('pharmacy_phc_item_idx').on(table.phcId, table.itemName),
  lowStockIdx: index('pharmacy_low_stock_idx').on(table.currentStock),
}));

export const prescriptions = pgTable('prescriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  encounterId: uuid('encounter_id').notNull().references(() => encounters.id),
  patientId: uuid('patient_id').notNull().references(() => patients.id),
  inventoryItemId: uuid('inventory_item_id').notNull().references(() => pharmacyInventory.id),
  quantity: integer('quantity').notNull(),
  dosageInstructions: text('dosage_instructions'),
  dispensed: boolean('dispensed').notNull().default(false),
  dispensedAt: timestamp('dispensed_at', { withTimezone: true }),
  dispensedByStaffId: uuid('dispensed_by_staff_id').references(() => staff.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  encounterIdx: index('prescriptions_encounter_idx').on(table.encounterId),
  dispensedIdx: index('prescriptions_dispensed_idx').on(table.dispensed),
}));

export const restockRequests = pgTable('restock_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  inventoryItemId: uuid('inventory_item_id').notNull().references(() => pharmacyInventory.id),
  phcId: uuid('phc_id').notNull().references(() => phcs.id),
  requestedByStaffId: uuid('requested_by_staff_id').references(() => staff.id),
  quantityRequested: integer('quantity_requested').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'), // pending | acknowledged | fulfilled
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─────────────────────────────────────────────────────────────
// SMS REMINDERS
// ─────────────────────────────────────────────────────────────

export const reminders = pgTable('reminders', {
  id: uuid('id').primaryKey().defaultRandom(),
  patientId: uuid('patient_id').notNull().references(() => patients.id),
  phcId: uuid('phc_id').notNull().references(() => phcs.id),
  type: reminderTypeEnum('type').notNull(),
  label: varchar('label', { length: 160 }).notNull(), // e.g. "Polio Dose 2"
  dueDate: timestamp('due_date', { mode: 'date' }).notNull(),
  recipientPhone: varchar('recipient_phone', { length: 20 }).notNull(),
  status: reminderStatusEnum('status').notNull().default('scheduled'),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  provider: varchar('provider', { length: 20 }), // 'termii' | 'africas_talking'
  providerMessageId: varchar('provider_message_id', { length: 120 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  dueDateIdx: index('reminders_due_date_idx').on(table.dueDate),
  statusIdx: index('reminders_status_idx').on(table.status),
}));

// ─────────────────────────────────────────────────────────────
// SYNC INFRASTRUCTURE (server-side mirror of client syncLog concept)
// ─────────────────────────────────────────────────────────────

export const syncOperations = pgTable('sync_operations', {
  id: uuid('id').primaryKey().defaultRandom(),
  phcId: uuid('phc_id').notNull().references(() => phcs.id),
  deviceId: varchar('device_id', { length: 80 }).notNull(),
  entityType: varchar('entity_type', { length: 40 }).notNull(),
  entityId: uuid('entity_id').notNull(),
  operation: varchar('operation', { length: 10 }).notNull(), // 'create' | 'update' | 'delete' | 'delta'
  payload: text('payload').notNull(), // JSON blob
  clientUpdatedAt: timestamp('client_updated_at', { withTimezone: true }).notNull(),
  serverReceivedAt: timestamp('server_received_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  entityIdx: index('sync_ops_entity_idx').on(table.entityType, table.entityId),
  cursorIdx: index('sync_ops_cursor_idx').on(table.serverReceivedAt),
}));

// ─────────────────────────────────────────────────────────────
// RELATIONS
// ─────────────────────────────────────────────────────────────

export const patientsRelations = relations(patients, ({ one, many }) => ({
  phc: one(phcs, { fields: [patients.phcId], references: [phcs.id] }),
  family: one(families, { fields: [patients.familyId], references: [families.id] }),
  encounters: many(encounters),
  vitalsRecords: many(vitalsRecords),
  queueTickets: many(queueTickets),
  reminders: many(reminders),
}));

export const encountersRelations = relations(encounters, ({ one, many }) => ({
  patient: one(patients, { fields: [encounters.patientId], references: [patients.id] }),
  vitalsRecords: many(vitalsRecords),
  prescriptions: many(prescriptions),
}));

export const pharmacyInventoryRelations = relations(pharmacyInventory, ({ many }) => ({
  prescriptions: many(prescriptions),
  restockRequests: many(restockRequests),
}));

export const queueTicketsRelations = relations(queueTickets, ({ one }) => ({
  patient: one(patients, { fields: [queueTickets.patientId], references: [patients.id] }),
  encounter: one(encounters, { fields: [queueTickets.encounterId], references: [encounters.id] }),
}));
```

### Notes on design decisions

- **`clinicId` is separate from the UUID `id`.** The UUID is the sync-safe primary key generated offline; `clinicId` is the short human/QR-facing identifier, scoped unique per PHC (not globally) since two PHCs may independently generate overlapping short codes before ever syncing.
- **`triageRules` is a data table, not code.** This directly satisfies the PRD requirement that the Head of PHC can adjust thresholds without a redeploy.
- **`pharmacyInventory.currentStock` is mutated via delta operations** at the sync layer (see Document 2 §2.5) — the column itself is a plain integer, but it must never be overwritten via naive LWW during sync merges.
- **`familyRelationships` is a directed edge table**, not a symmetric one — store both directions explicitly at write time (`parent→child` and `child→parent`) so lookups in either direction are a single indexed query rather than requiring OR-logic.
