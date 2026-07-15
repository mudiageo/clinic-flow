import Dexie, { type Table } from 'dexie';

export interface LocalPatient {
	id: string; // UUID, generated client-side at creation time
	clinicId: string;
	phcId: string;
	familyId: string | null;
	guardianId: string | null;
	name: string;
	phone: string | null;
	dob: string | null;
	sex: 'male' | 'female' | 'other';
	address: string | null;
	community: string | null;
	nextOfKinName: string | null;
	nextOfKinPhone: string | null;
	isPregnant: boolean;
	syncStatus: 'synced' | 'pending' | 'conflict';
	updatedAt: number; // epoch ms, used for LWW + sync cursors
	serverUpdatedAt: number | null;
	deleted: boolean;
}

export interface LocalQueueTicket {
	id: string;
	patientId: string;
	phcId: string;
	encounterId: string | null;
	ticketNumber: number;
	status: 'waiting' | 'called' | 'in_progress' | 'done' | 'no_show';
	triageLevel: 'unassigned' | 'green' | 'amber' | 'red';
	triageReason: string | null;
	calledAt?: number | null;
	completedAt?: number | null;
	createdAt: number;
	syncStatus: 'synced' | 'pending' | 'conflict';
	updatedAt: number;
}

export interface LocalVitalsRecord {
	id: string;
	encounterId: string;
	patientId: string;
	temperatureCelsius: number | null;
	systolicBp: number | null;
	diastolicBp: number | null;
	pulseBpm: number | null;
	weightKg: number | null;
	spo2Percent: number | null;
	triageLevel: 'unassigned' | 'green' | 'amber' | 'red';
	triageReason: string | null;
	recordedAt: number;
	syncStatus: 'synced' | 'pending' | 'conflict';
	updatedAt: number;
}

export interface LocalPharmacyInventory {
	id: string;
	phcId: string;
	itemName: string;
	category: string | null;
	unit: string;
	currentStock: number;
	lowStockThreshold: number;
	isCritical: boolean;
	syncStatus: 'synced' | 'pending' | 'conflict';
	updatedAt: number;
}

export interface LocalSyncOperation {
	id: string;
	phcId: string;
	entityName:
		| 'patients'
		| 'queueTickets'
		| 'vitalsRecords'
		| 'encounters'
		| 'pharmacyInventory'
		| 'prescriptions'
		| 'restockRequests'
		| 'reminders'
		| 'labRequests';
	entityId: string;
	operation: 'INSERT' | 'UPDATE' | 'DELETE';
	payload: any;
	status: 'pending' | 'processing' | 'failed' | 'completed';
	createdAt: number;
	retryCount: number;
	errorMessage: string | null;
}

export interface LocalLabRequest {
	id: string;
	encounterId: string;
	patientId: string;
	phcId: string;
	requestedByStaffId: string;
	testType: string;
	urgency: 'routine' | 'urgent' | 'stat';
	notes: string | null;
	status: 'pending' | 'processing' | 'completed';
	result: string | null;
	resultEnteredByStaffId: string | null;
	resultEnteredAt: number | null;
	createdAt: number;
	updatedAt: number;
	syncStatus: 'synced' | 'pending' | 'conflict';
}

export interface LocalEncounter {
	id: string;
	patientId: string;
	phcId: string;
	recordedByStaffId: string | null;
	visitDate: number;
	chiefComplaint: string | null;
	chiefComplaintRaw: string | null;
	chiefComplaintLanguage: string | null;
	doctorNotes: string | null;
	createdAt: number;
	updatedAt: number;
	syncStatus: 'synced' | 'pending' | 'conflict';
}

export interface LocalReminder {
	id: string;
	patientId: string;
	phcId: string;
	type: 'immunization' | 'antenatal' | 'follow_up';
	label: string;
	dueDate: number;
	recipientPhone: string;
	status: 'scheduled' | 'sent' | 'failed' | 'cancelled';
	sentAt: number | null;
	provider: string | null;
	providerMessageId: string | null;
	createdAt: number;
	syncStatus: 'synced' | 'pending' | 'conflict';
	updatedAt: number;
}

export interface LocalTriageRule {
	id: string;
	phcId: string;
	field: string;
	operator: string;
	threshold: number;
	resultingLevel: 'green' | 'amber' | 'red';
	reasonTemplate: string;
	requiresPregnant: boolean;
	active: boolean;
	version: number;
	syncStatus: 'synced' | 'pending' | 'conflict';
	updatedAt: number;
}

export interface LocalPrescription {
	id: string;
	patientId: string;
	encounterId: string;
	phcId: string;
	inventoryId: string;
	medicationName: string;
	quantity: number;
	dosage: string;
	status: 'pending' | 'dispensed';
	createdAt: number;
	syncStatus: 'synced' | 'pending' | 'conflict';
	updatedAt: number;
}

export interface SyncLogEntry {
	localId?: number; // auto-increment
	entityType: string;
	entityId: string;
	operation: 'create' | 'update' | 'delete' | 'delta';
	payload: unknown;
	timestamp: number;
	synced: 0 | 1;
}

class ClinicFlowDB extends Dexie {
	patients!: Table<LocalPatient, string>;
	queueTickets!: Table<LocalQueueTicket, string>;
	vitalsRecords!: Table<LocalVitalsRecord, string>;
	pharmacyInventory!: Table<LocalPharmacyInventory, string>;
	syncOperations!: Table<LocalSyncOperation, string>;
	labRequests!: Table<LocalLabRequest, string>;
	reminders!: Table<LocalReminder, string>;
	encounters!: Table<LocalEncounter, string>;
	triageRules!: Table<LocalTriageRule, string>;
	prescriptions!: Table<LocalPrescription, string>;
	syncLog!: Table<SyncLogEntry, number>;

	constructor() {
		super('clinicflow');
		this.version(1).stores({
			patients: 'id, clinicId, familyId, name, phone, syncStatus, updatedAt',
			queueTickets: 'id, patientId, status, triageLevel, createdAt, syncStatus',
			vitalsRecords: 'id, patientId, recordedAt, syncStatus',
			pharmacyInventory: 'id, itemName, currentStock, syncStatus',
			reminders: 'id, patientId, phcId, status, dueDate, syncStatus',
			labRequests: 'id, patientId, encounterId, phcId, status, urgency, syncStatus',
			triageRules: 'id, field, active, syncStatus',
			syncLog: '++localId, entityType, entityId, operation, timestamp, synced'
		});
		this.version(2).stores({
			prescriptions: 'id, patientId, status, syncStatus',
			encounters: 'id, patientId, visitDate, syncStatus'
		});
	}
}

// Not exported. Only src/lib/state/*.svelte.ts may import this file.
export const db = new ClinicFlowDB();
