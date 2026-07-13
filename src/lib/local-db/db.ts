import Dexie, { type Table } from 'dexie';

export interface LocalPatient {
  id: string;            // UUID, generated client-side at creation time
  clinicId: string;
  familyId: string | null;
  guardianId: string | null;
  name: string;
  phone: string | null;
  dob: string | null;
  sex: 'male' | 'female' | 'other';
  syncStatus: 'synced' | 'pending' | 'conflict';
  updatedAt: number;      // epoch ms, used for LWW + sync cursors
  serverUpdatedAt: number | null;
  deleted: boolean;
}

export interface LocalQueueTicket {
  id: string;
  patientId: string;
  ticketNumber: number;
  status: 'waiting' | 'called' | 'in_progress' | 'done';
  triageLevel: 'green' | 'amber' | 'red';
  triageReason: string | null;
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
  triageLevel: 'green' | 'amber' | 'red';
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

export interface SyncLogEntry {
  localId?: number;       // auto-increment
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
  reminders!: Table<LocalReminder, string>;
  syncLog!: Table<SyncLogEntry, number>;

  constructor() {
    super('clinicflow');
    this.version(1).stores({
      patients: 'id, clinicId, familyId, name, phone, syncStatus, updatedAt',
      queueTickets: 'id, patientId, status, triageLevel, createdAt, syncStatus',
      vitalsRecords: 'id, patientId, recordedAt, syncStatus',
      pharmacyInventory: 'id, itemName, currentStock, syncStatus',
      reminders: 'id, patientId, dueDate, status, syncStatus',
      syncLog: '++localId, entityType, entityId, operation, timestamp, synced',
    });
  }
}

// Not exported. Only src/lib/state/*.svelte.ts may import this file.
export const db = new ClinicFlowDB();
