/**
 * Deterministic, synthetic ClinicFlow demo data.
 *
 * Safe to import from both the browser and Node: no Drizzle, no `$app`, no
 * Dexie runtime import. All IDs and relationships are derived from the profile
 * slug, so re-running a seed upserts the same records instead of duplicating.
 */

import type {
	LocalAppointment,
	LocalEncounter,
	LocalFamily,
	LocalLabRequest,
	LocalPatient,
	LocalPharmacyInventory,
	LocalPregnancyRecord,
	LocalPrescription,
	LocalQueueTicket,
	LocalReminder,
	LocalRestockRequest,
	LocalStaff,
	LocalTriageRule,
	LocalVitalsRecord
} from '#lib/local-db/db.ts';

export const SEED_NAMESPACE = 'clinicflow-demo-2026-11';
export const SEED_DEVICE_ID = 'clinicflow-seed';

/** Stable UUID-shaped id. Not cryptographic — only needs to be repeatable. */
export function seedId(key: string): string {
	const input = `${SEED_NAMESPACE}:${key}`;
	const bytes = new Uint8Array(16);
	let hash = 2166136261;
	for (let round = 0; round < 16; round++) {
		for (let i = 0; i < input.length; i++) {
			hash = Math.imul(hash ^ input.charCodeAt(i), 16777619) >>> 0;
			hash = (hash + round) >>> 0;
		}
		bytes[round] = (hash >>> ((round % 4) * 8)) & 0xff;
	}
	bytes[6] = (bytes[6] & 0x0f) | 0x50;
	bytes[8] = (bytes[8] & 0x3f) | 0x80;
	const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
	return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function mulberry32(seed: number) {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function hashString(value: string): number {
	let h = 2166136261;
	for (let i = 0; i < value.length; i++) h = Math.imul(h ^ value.charCodeAt(i), 16777619) >>> 0;
	return h >>> 0;
}

const DAY = 24 * 60 * 60 * 1000;

export type StaffProfile = { key: string; name: string; email: string; role: string };
export type PhcProfile = {
	slug: string;
	name: string;
	lga: string;
	state: string;
	clinicPrefix: string;
	patientCount: number;
	familyCount: number;
	stockLevel: 'healthy' | 'low' | 'critical';
	outbreak: boolean;
	flags: Record<string, boolean>;
	lgaDsoPhone: string;
	staff: StaffProfile[];
};

const COMMON_STAFF: StaffProfile[] = [
	{ key: 'admin', name: 'Admin Izevbokun', email: 'admin@clinic.com', role: 'admin' },
	{ key: 'oic', name: 'Dr. Adaeze Obi', email: 'oic@clinic.com', role: 'oic' },
	{ key: 'cho', name: 'Mr. Sunday Ehiwe', email: 'cho@clinic.com', role: 'cho' },
	{ key: 'doctor', name: 'Dr. Osasere', email: 'doctor@clinic.com', role: 'doctor' },
	{ key: 'doctor2', name: 'Dr. Ijeoma Nwosu', email: 'doctor2@clinic.com', role: 'doctor' },
	{ key: 'nurse', name: 'Nurse Idia', email: 'nurse@clinic.com', role: 'nurse' },
	{ key: 'nurse2', name: 'Nurse Bunmi Adeyemi', email: 'nurse2@clinic.com', role: 'nurse' },
	{
		key: 'midwife',
		name: 'Midwife Onyeka Nwosu',
		email: 'midwife@clinic.com',
		role: 'nurse_midwife'
	},
	{ key: 'pharmacy', name: 'Pharmacist Nosakhare', email: 'pharmacy@clinic.com', role: 'pharmacy' },
	{
		key: 'reception',
		name: 'Receptionist Efe',
		email: 'reception@clinic.com',
		role: 'receptionist'
	},
	{
		key: 'reception2',
		name: 'Receptionist Halima Bello',
		email: 'reception2@clinic.com',
		role: 'receptionist'
	},
	{ key: 'chew', name: 'CHW Godwin Ese', email: 'chew@clinic.com', role: 'chew' },
	{ key: 'jchew', name: 'JCHW Faith Udu', email: 'jchew@clinic.com', role: 'jchew' },
	{ key: 'eho', name: 'EHO Kingsley Omoregie', email: 'eho@clinic.com', role: 'eho' },
	{
		key: 'superadmin',
		name: 'Platform Superadmin',
		email: 'superadmin@clinic.com',
		role: 'superadmin'
	}
];

function staffFor(
	slug: string,
	spec: Array<Partial<StaffProfile> & { key: string; name: string; role: string }>
): StaffProfile[] {
	return spec.map((s) => ({
		key: s.key,
		name: s.name,
		role: s.role,
		email: s.email ?? `${s.key}.${slug}@clinic.com`
	}));
}

export const PHC_PROFILES: PhcProfile[] = [
	{
		slug: 'oredo',
		name: 'Oredo Primary Health Centre',
		lga: 'Oredo',
		state: 'Edo State',
		clinicPrefix: 'ORD',
		patientCount: 45,
		familyCount: 12,
		stockLevel: 'healthy',
		outbreak: false,
		lgaDsoPhone: '08055551001',
		flags: {},
		staff: COMMON_STAFF
	},
	{
		slug: 'ikpoba-okha',
		name: 'Ikpoba-Okha Primary Health Centre',
		lga: 'Ikpoba-Okha',
		state: 'Edo State',
		clinicPrefix: 'IKP',
		patientCount: 25,
		familyCount: 7,
		stockLevel: 'low',
		outbreak: false,
		lgaDsoPhone: '08055551002',
		flags: { nhisTrackingEnabled: true, familyHealthEnabled: true },
		staff: staffFor('ikpoba-okha', [
			{ key: 'admin', name: 'Admin Faith Ekhaese', role: 'admin' },
			{ key: 'doctor', name: 'Dr. Ehi Igbinedion', role: 'doctor' },
			{ key: 'nurse', name: 'Nurse Rose Osa', role: 'nurse' },
			{ key: 'midwife', name: 'Midwife Blessing Iyamu', role: 'nurse_midwife' },
			{ key: 'pharmacy', name: 'Pharmacist Ken Aibangbee', role: 'pharmacy' },
			{ key: 'reception', name: 'Receptionist Sandra Obi', role: 'receptionist' }
		])
	},
	{
		slug: 'egor',
		name: 'Egor Primary Health Centre',
		lga: 'Egor',
		state: 'Edo State',
		clinicPrefix: 'EGR',
		patientCount: 15,
		familyCount: 4,
		stockLevel: 'critical',
		outbreak: true,
		lgaDsoPhone: '08055551003',
		flags: { referralsEnabled: false },
		staff: staffFor('egor', [
			{ key: 'admin', name: 'Admin John Osa', role: 'admin' },
			{ key: 'doctor', name: 'Dr. Grace Uwa', role: 'doctor' },
			{ key: 'nurse', name: 'Nurse Patience Edo', role: 'nurse' },
			{ key: 'nurse2', name: 'Nurse Stella Ogbomo', role: 'nurse' },
			{ key: 'chew', name: 'CHW Monday Iyare', role: 'chew' }
		])
	}
];

const MALE_NAMES = [
	'Osaro Igbinosa',
	'Efe Omoregie',
	'Chinedu Eze',
	'Godwin Ese',
	'Victor Imasuen',
	'Kabir Usman',
	'Musa Dauda',
	'Sunday Ehiwe',
	'Emmanuel Obi',
	'Ibrahim Bello',
	'Osahon Igbinedion',
	'Ehi Aibangbee',
	'Uche Nwosu',
	'Tunde Adeyemi',
	'Sani Musa'
];
const FEMALE_NAMES = [
	'Adesuwa Igbinosa',
	'Ivie Omoregie',
	'Amina Bello',
	'Fatima Musa',
	'Halima Sani',
	'Zainab Ali',
	'Efe Ighodaro',
	'Amen Osagie',
	'Imose Idahosa',
	'Itohan Igbinosa',
	'Ngozi Obi',
	'Blessing Iyamu',
	'Rose Osa',
	'Grace Uwa',
	'Patience Edo',
	'Stella Ogbomo',
	'Onyeka Nwosu',
	'Sandra Obi',
	'Efosa Ighodaro',
	'Osasere Osagie'
];
const COMMUNITIES = [
	'GRA',
	'Uselu',
	'Ikpoba Hill',
	'Airport Road',
	'Ekenwan Road',
	'Ring Road',
	'Sabon Gari',
	'Oka',
	'Ugbiyoko',
	'New Benin'
];
const COMPLAINTS = [
	'Fever and headache for 3 days',
	'Routine blood pressure check, feeling dizzy',
	'Productive cough and chest pain',
	'Abdominal pain and vomiting',
	'Prenatal check-up',
	'Routine immunisation',
	'Diarrhoea for two days',
	'Body rash and itching',
	'Sore throat and catarrh',
	'Follow-up review for malaria'
];

const INVENTORY: Array<{
	name: string;
	category: string;
	unit: string;
	threshold: number;
	critical: boolean;
}> = [
	{
		name: 'Artemether-Lumefantrine (AL) 20/120mg',
		category: 'antimalarial',
		unit: 'pack',
		threshold: 20,
		critical: true
	},
	{
		name: 'Sulfadoxine-Pyrimethamine (SP)',
		category: 'antimalarial',
		unit: 'dose',
		threshold: 20,
		critical: true
	},
	{
		name: 'Amoxicillin 500mg',
		category: 'antibiotic',
		unit: 'capsule',
		threshold: 30,
		critical: true
	},
	{
		name: 'Metronidazole 400mg',
		category: 'antibiotic',
		unit: 'tablet',
		threshold: 25,
		critical: false
	},
	{
		name: 'Ciprofloxacin 500mg',
		category: 'antibiotic',
		unit: 'tablet',
		threshold: 25,
		critical: false
	},
	{
		name: 'Paracetamol 500mg',
		category: 'analgesic',
		unit: 'tablet',
		threshold: 50,
		critical: false
	},
	{
		name: 'Ibuprofen 400mg',
		category: 'analgesic',
		unit: 'tablet',
		threshold: 40,
		critical: false
	},
	{
		name: 'Oral Rehydration Salts (ORS)',
		category: 'rehydration',
		unit: 'sachet',
		threshold: 50,
		critical: true
	},
	{
		name: 'Zinc Sulfate 20mg',
		category: 'supplement',
		unit: 'tablet',
		threshold: 40,
		critical: true
	},
	{
		name: 'Folic Acid 5mg',
		category: 'supplement',
		unit: 'tablet',
		threshold: 100,
		critical: false
	},
	{
		name: 'Ferrous Sulfate 200mg',
		category: 'supplement',
		unit: 'tablet',
		threshold: 100,
		critical: false
	},
	{
		name: 'Vitamin A 200,000 IU',
		category: 'supplement',
		unit: 'capsule',
		threshold: 50,
		critical: false
	},
	{ name: 'BCG Vaccine', category: 'vaccine', unit: 'vial', threshold: 5, critical: true },
	{
		name: 'Oral Polio Vaccine (OPV)',
		category: 'vaccine',
		unit: 'dose',
		threshold: 20,
		critical: true
	},
	{ name: 'Measles Vaccine', category: 'vaccine', unit: 'vial', threshold: 10, critical: true },
	{ name: 'Oxytocin 10 IU', category: 'maternal', unit: 'ampoule', threshold: 15, critical: true },
	{
		name: 'Magnesium Sulfate',
		category: 'maternal',
		unit: 'ampoule',
		threshold: 10,
		critical: true
	},
	{
		name: 'Insulin (Human 100 IU)',
		category: 'chronic',
		unit: 'vial',
		threshold: 10,
		critical: true
	},
	{ name: 'Amlodipine 5mg', category: 'chronic', unit: 'tablet', threshold: 60, critical: false },
	{
		name: 'Condoms (male)',
		category: 'family_planning',
		unit: 'piece',
		threshold: 100,
		critical: false
	}
];

/** One canonical triage rule set, shared by server and client. No duplicate (field, operator, threshold, pregnancy). */
export const CANONICAL_TRIAGE_RULES = [
	{
		field: 'temperatureCelsius',
		operator: 'gte',
		threshold: 39.5,
		resultingLevel: 'red',
		reasonTemplate: 'Critical Fever (≥39.5°C)',
		requiresPregnant: false
	},
	{
		field: 'temperatureCelsius',
		operator: 'gte',
		threshold: 37.5,
		resultingLevel: 'amber',
		reasonTemplate: 'High Fever (≥37.5°C)',
		requiresPregnant: false
	},
	{
		field: 'temperatureCelsius',
		operator: 'lte',
		threshold: 35,
		resultingLevel: 'red',
		reasonTemplate: 'Hypothermia (≤35°C)',
		requiresPregnant: false
	},
	{
		field: 'systolicBp',
		operator: 'gte',
		threshold: 160,
		resultingLevel: 'red',
		reasonTemplate: 'Critical Hypertension (≥160)',
		requiresPregnant: false
	},
	{
		field: 'systolicBp',
		operator: 'gte',
		threshold: 140,
		resultingLevel: 'amber',
		reasonTemplate: 'High Blood Pressure (≥140)',
		requiresPregnant: false
	},
	{
		field: 'diastolicBp',
		operator: 'gte',
		threshold: 100,
		resultingLevel: 'red',
		reasonTemplate: 'Critical Diastolic BP (≥100)',
		requiresPregnant: false
	},
	{
		field: 'diastolicBp',
		operator: 'gte',
		threshold: 90,
		resultingLevel: 'amber',
		reasonTemplate: 'High Diastolic BP (≥90)',
		requiresPregnant: false
	},
	{
		field: 'systolicBp',
		operator: 'gte',
		threshold: 130,
		resultingLevel: 'red',
		reasonTemplate: 'Pregnancy Hypertension Alert (≥130)',
		requiresPregnant: true
	},
	{
		field: 'diastolicBp',
		operator: 'gte',
		threshold: 80,
		resultingLevel: 'red',
		reasonTemplate: 'Pregnancy Hypertension Alert (≥80)',
		requiresPregnant: true
	},
	{
		field: 'spo2Percent',
		operator: 'lte',
		threshold: 92,
		resultingLevel: 'red',
		reasonTemplate: 'Critical Hypoxia (SpO2 ≤92%)',
		requiresPregnant: false
	},
	{
		field: 'spo2Percent',
		operator: 'lte',
		threshold: 95,
		resultingLevel: 'amber',
		reasonTemplate: 'Low Oxygen (SpO2 ≤95%)',
		requiresPregnant: false
	},
	{
		field: 'pulseBpm',
		operator: 'gte',
		threshold: 120,
		resultingLevel: 'red',
		reasonTemplate: 'Severe Tachycardia (≥120)',
		requiresPregnant: false
	},
	{
		field: 'pulseBpm',
		operator: 'lte',
		threshold: 50,
		resultingLevel: 'red',
		reasonTemplate: 'Severe Bradycardia (≤50)',
		requiresPregnant: false
	},
	{
		field: 'pulseBpm',
		operator: 'gte',
		threshold: 100,
		resultingLevel: 'amber',
		reasonTemplate: 'Mild Tachycardia (≥100)',
		requiresPregnant: false
	},
	{
		field: 'pulseBpm',
		operator: 'lte',
		threshold: 60,
		resultingLevel: 'amber',
		reasonTemplate: 'Mild Bradycardia (≤60)',
		requiresPregnant: false
	}
] as const;

export type ServerOnlyRecords = {
	devices: Array<{
		id: string;
		phcId: string;
		name: string;
		macAddress: string;
		role: string;
		status: string;
	}>;
	smsInbox: Array<{
		id: string;
		phcId: string;
		patientId: string | null;
		fromPhone: string;
		message: string;
		isRead: boolean;
	}>;
	auditLog: Array<{
		id: string;
		phcId: string;
		staffId: string | null;
		action: string;
		entityType: string;
		entityId: string | null;
		metadata: string | null;
	}>;
};

export type FixtureSet = {
	profile: PhcProfile;
	phcId: string;
	authUsers: Array<{ id: string; email: string; name: string; role: string; password: string }>;
	staff: LocalStaff[];
	families: LocalFamily[];
	patients: LocalPatient[];
	encounters: LocalEncounter[];
	vitalsRecords: LocalVitalsRecord[];
	queueTickets: LocalQueueTicket[];
	pharmacyInventory: LocalPharmacyInventory[];
	prescriptions: LocalPrescription[];
	labRequests: LocalLabRequest[];
	restockRequests: LocalRestockRequest[];
	reminders: LocalReminder[];
	appointments: LocalAppointment[];
	pregnancyRecords: LocalPregnancyRecord[];
	triageRules: LocalTriageRule[];
	serverOnly: ServerOnlyRecords;
};

export function buildFixtures(profile: PhcProfile, now = Date.now()): FixtureSet {
	const sid = (key: string) => seedId(`${profile.slug}:${key}`);
	const phcId = sid('phc');
	const rand = mulberry32(hashString(profile.slug));
	const daysAgo = (days: number) => now - days * DAY;

	const authUsers = profile.staff.map((s) => ({
		id: seedId(`auth:${s.email}`),
		email: s.email,
		name: s.name,
		role: s.role,
		password: 'password123'
	}));

	const staff: LocalStaff[] = profile.staff.map((s) => ({
		id: sid(`staff:${s.key}`),
		authUserId: seedId(`auth:${s.email}`),
		fullName: s.name,
		role: s.role,
		phcId,
		active: true,
		syncStatus: 'synced',
		updatedAt: daysAgo(10)
	}));

	const families: LocalFamily[] = Array.from({ length: profile.familyCount }, (_, i) => ({
		id: sid(`family:${i}`),
		householdName: `${['Ighodaro', 'Osagie', 'Idahosa', 'Igbinosa', 'Imasuen', 'Bello', 'Eze', 'Obi', 'Adeyemi', 'Musa', 'Ehiwe', 'Uwa'][i % 12]} Family`,
		community: COMMUNITIES[i % COMMUNITIES.length],
		syncStatus: 'synced',
		updatedAt: daysAgo(20)
	}));

	const patients: LocalPatient[] = Array.from({ length: profile.patientCount }, (_, i) => {
		const female = i % 2 === 0;
		const name = female ? FEMALE_NAMES[i % FEMALE_NAMES.length] : MALE_NAMES[i % MALE_NAMES.length];
		const age = 2 + Math.floor(rand() * 68);
		const isPregnant = female && age >= 20 && age <= 42 && i % 5 === 0;
		const recorded = daysAgo(Math.floor(rand() * 40));
		return {
			id: sid(`patient:${i}`),
			clinicId: `${profile.clinicPrefix}-${String(i + 1).padStart(4, '0')}`,
			phcId,
			familyId: families[i % families.length].id,
			guardianId: null,
			name,
			phone: `080${String(10000000 + Math.floor(rand() * 89999999)).slice(0, 9)}`,
			dob: new Date(now - age * 365 * DAY).toISOString().slice(0, 10),
			sex: female ? 'female' : 'male',
			address: `${1 + Math.floor(rand() * 40)} ${COMMUNITIES[i % COMMUNITIES.length]} Road`,
			community: COMMUNITIES[i % COMMUNITIES.length],
			nextOfKinPhone: null,
			isPregnant,
			isNhis: i % 4 === 0,
			syncStatus: 'synced',
			updatedAt: recorded,
			serverUpdatedAt: recorded,
			deleted: i === profile.patientCount - 1 // one soft-deleted record for realistic filtering
		};
	});

	// Guardian link for a child patient
	if (patients.length > 3) {
		patients[2].guardianId = patients[1].id;
	}

	const encounters: LocalEncounter[] = [];
	const vitalsRecords: LocalVitalsRecord[] = [];
	patients.forEach((patient, pi) => {
		if (patient.deleted) return;
		const count = 1 + Math.floor(rand() * 3);
		for (let e = 0; e < count; e++) {
			const visitDate = daysAgo(1 + Math.floor(rand() * 88));
			const encounterId = sid(`encounter:${pi}:${e}`);
			const complaintIndex =
				profile.outbreak && pi < 6 ? 6 : Math.floor(rand() * COMPLAINTS.length);
			const complaint = COMPLAINTS[complaintIndex];
			encounters.push({
				id: encounterId,
				patientId: patient.id,
				phcId,
				recordedByStaffId: staff.find((s) => s.role === 'nurse')?.id ?? null,
				visitDate,
				chiefComplaint: complaint,
				chiefComplaintRaw: pi % 7 === 0 ? `I dey get ${complaint.toLowerCase()}` : null,
				chiefComplaintLanguage: pi % 7 === 0 ? 'pidgin' : null,
				doctorNotes: e === 0 ? 'Reviewed. Advised treatment and follow-up.' : null,
				isNhisBillable: pi % 4 === 0,
				createdAt: visitDate,
				updatedAt: visitDate,
				syncStatus: 'synced'
			});

			const outbreakCase = profile.outbreak && pi < 6;
			const temperature = outbreakCase ? 37.8 + rand() * 1.4 : 36.4 + rand() * 2.6;
			const systolic = patient.isPregnant
				? 132 + Math.floor(rand() * 18)
				: 110 + Math.floor(rand() * 55);
			const diastolic = 70 + Math.floor(rand() * 30);
			let triageLevel: 'green' | 'amber' | 'red' = 'green';
			const reasons: string[] = [];
			if (temperature >= 37.5 || systolic >= 140) {
				triageLevel = 'amber';
				reasons.push(temperature >= 37.5 ? 'High Fever (≥37.5°C)' : 'High Blood Pressure (≥140)');
			}
			if (patient.isPregnant && systolic >= 130) {
				triageLevel = 'red';
				reasons.push('Pregnancy Hypertension Alert (≥130)');
			}
			if (outbreakCase && triageLevel !== 'red') triageLevel = 'amber';
			vitalsRecords.push({
				id: sid(`vitals:${pi}:${e}`),
				encounterId,
				patientId: patient.id,
				temperatureCelsius: Math.round(temperature * 10) / 10,
				systolicBp: systolic,
				diastolicBp: diastolic,
				pulseBpm: 70 + Math.floor(rand() * 50),
				weightKg: 12 + Math.round(rand() * 60),
				spo2Percent: 92 + Math.floor(rand() * 8),
				triageLevel,
				triageReason: reasons.join('; ') || null,
				recordedAt: visitDate,
				syncStatus: 'synced',
				updatedAt: visitDate
			});
		}
	});

	const activeQueue: LocalQueueTicket[] = [];
	const historicalQueue: LocalQueueTicket[] = [];
	const activePatients = patients.filter((p) => !p.deleted).slice(0, 9);
	activePatients.forEach((patient, i) => {
		const encounter = encounters.find((enc) => enc.patientId === patient.id);
		const outbreakCase = profile.outbreak && i < 6;
		const level = outbreakCase
			? 'amber'
			: (['red', 'amber', 'green', 'green', 'amber'] as const)[i % 5];
		const status = (['waiting', 'waiting', 'called', 'in_progress', 'waiting'] as const)[i % 5];
		const createdAt = now - (i + 1) * 4 * 60 * 1000;
		activeQueue.push({
			id: sid(`queue:active:${i}`),
			patientId: patient.id,
			phcId,
			encounterId: encounter?.id ?? null,
			ticketNumber: i + 1,
			status,
			triageLevel: level,
			triageReason:
				level === 'red' ? 'Critical Hypertension' : level === 'amber' ? 'High Fever' : null,
			aiRiskScore: outbreakCase ? 62 + i : null,
			aiRiskRationale: outbreakCase ? 'Clustered watery diarrhoea in last 10 days' : null,
			department: outbreakCase ? 'epi' : patient.isPregnant ? 'anc' : 'general',
			calledAt: status === 'called' || status === 'in_progress' ? createdAt + 60000 : null,
			completedAt: null,
			createdAt,
			syncStatus: 'synced',
			updatedAt: createdAt
		});
	});
	encounters.slice(0, 25).forEach((encounter, i) => {
		const createdAt = Math.max(encounter.visitDate, daysAgo(60));
		historicalQueue.push({
			id: sid(`queue:history:${i}`),
			patientId: encounter.patientId,
			phcId,
			encounterId: encounter.id,
			ticketNumber: 100 + i,
			status: i % 7 === 0 ? 'no_show' : 'done',
			triageLevel: 'green',
			triageReason: null,
			department: 'general',
			calledAt: createdAt + 60000,
			completedAt: createdAt + 20 * 60000,
			createdAt,
			syncStatus: 'synced',
			updatedAt: createdAt
		});
	});
	const queueTickets = [...activeQueue, ...historicalQueue];

	const stockFactor =
		profile.stockLevel === 'healthy' ? 1 : profile.stockLevel === 'low' ? 0.55 : 0.2;
	const pharmacyInventory: LocalPharmacyInventory[] = INVENTORY.map((item, i) => {
		const stock = Math.max(0, Math.round(item.threshold * (1.2 + rand() * 2) * stockFactor));
		return {
			id: sid(`inventory:${i}`),
			phcId,
			itemName: item.name,
			category: item.category,
			unit: item.unit,
			currentStock: stock,
			lowStockThreshold: item.threshold,
			isCritical: item.critical,
			syncStatus: 'synced',
			updatedAt: daysAgo(3)
		};
	});

	const prescriptions: LocalPrescription[] = [];
	const labRequests: LocalLabRequest[] = [];
	encounters.slice(0, Math.max(8, Math.floor(encounters.length * 0.7))).forEach((encounter, i) => {
		const item = pharmacyInventory[i % Math.min(6, pharmacyInventory.length)];
		const dispensed = i % 3 !== 0;
		prescriptions.push({
			id: sid(`prescription:${i}`),
			patientId: encounter.patientId,
			encounterId: encounter.id,
			phcId,
			inventoryId: item.id,
			medicationName: item.itemName,
			quantity: 1 + Math.floor(rand() * 10),
			dosage: 'Take as directed by the clinician',
			status: dispensed ? 'dispensed' : 'pending',
			createdAt: encounter.visitDate,
			syncStatus: 'synced',
			updatedAt: encounter.visitDate
		});
		if (i % 4 === 0) {
			const completed = i % 8 === 0;
			labRequests.push({
				id: sid(`lab:${i}`),
				encounterId: encounter.id,
				patientId: encounter.patientId,
				phcId,
				requestedByStaffId: staff.find((s) => s.role === 'doctor')?.id ?? staff[0].id,
				testType: ['Malaria RDT', 'Full Blood Count', 'Urinalysis', 'Genotype'][i % 4],
				urgency: i % 5 === 0 ? 'urgent' : 'routine',
				notes: null,
				status: completed ? 'completed' : i % 8 === 4 ? 'processing' : 'pending',
				result: completed ? 'Negative' : null,
				resultEnteredByStaffId: completed
					? (staff.find((s) => s.role === 'doctor')?.id ?? null)
					: null,
				resultEnteredAt: completed ? encounter.visitDate + 3600000 : null,
				createdAt: encounter.visitDate,
				updatedAt: encounter.visitDate,
				syncStatus: 'synced'
			});
		}
	});

	const restockRequests: LocalRestockRequest[] = pharmacyInventory
		.filter((item) => item.currentStock <= item.lowStockThreshold)
		.slice(0, 5)
		.map((item, i) => ({
			id: sid(`restock:${i}`),
			inventoryItemId: item.id,
			phcId,
			requestedByStaffId: staff.find((s) => s.role === 'pharmacy')?.id ?? null,
			quantityRequested: item.lowStockThreshold * 3,
			status: (['pending', 'acknowledged', 'fulfilled'] as const)[i % 3],
			createdAt: daysAgo(2 + i),
			syncStatus: 'synced',
			updatedAt: daysAgo(2 + i)
		}));

	const reminders: LocalReminder[] = [];
	let reminderIndex = 0;
	patients
		.filter((p) => !p.deleted)
		.forEach((patient, pi) => {
			if (patient.isPregnant) {
				reminders.push({
					id: sid(`reminder:${reminderIndex++}`),
					patientId: patient.id,
					phcId,
					type: 'antenatal',
					label: 'ANC Follow-up Visit',
					dueDate: now + (3 + pi) * DAY,
					recipientPhone: patient.phone ?? '',
					status: 'scheduled',
					sentAt: null,
					provider: null,
					providerMessageId: null,
					createdAt: daysAgo(2),
					syncStatus: 'synced',
					updatedAt: daysAgo(2)
				});
			}
			if (pi % 3 === 0) {
				reminders.push({
					id: sid(`reminder:${reminderIndex++}`),
					patientId: patient.id,
					phcId,
					type: 'immunization',
					label: ['BCG at birth', 'OPV Dose 2', 'Measles Vaccine', 'Polio Dose 3'][pi % 4],
					dueDate: now + (5 + pi) * DAY,
					recipientPhone: patient.phone ?? '',
					status: pi % 6 === 0 ? 'sent' : 'scheduled',
					sentAt: pi % 6 === 0 ? daysAgo(1) : null,
					provider: pi % 6 === 0 ? 'termii' : null,
					providerMessageId: null,
					createdAt: daysAgo(5),
					syncStatus: 'synced',
					updatedAt: daysAgo(5)
				});
			}
			if (pi % 8 === 2) {
				reminders.push({
					id: sid(`reminder:${reminderIndex++}`),
					patientId: patient.id,
					phcId,
					type: 'follow_up',
					label: 'Post-treatment review',
					dueDate: now + (1 + pi) * DAY,
					recipientPhone: patient.phone ?? '',
					status: 'scheduled',
					sentAt: null,
					provider: null,
					providerMessageId: null,
					createdAt: daysAgo(1),
					syncStatus: 'synced',
					updatedAt: daysAgo(1)
				});
			}
		});

	const appointments: LocalAppointment[] = patients
		.filter((p) => !p.deleted)
		.slice(0, Math.min(20, patients.length))
		.map((patient, i) => {
			const scheduledAt = i % 3 === 0 ? daysAgo(7 + i) : now + (i + 1) * DAY;
			return {
				id: sid(`appointment:${i}`),
				patientId: patient.id,
				phcId,
				assignedStaffId: staff.find((s) => s.role === 'nurse')?.id ?? null,
				type: (['antenatal', 'immunization', 'follow-up', 'general', 'lab-follow-up'] as const)[
					i % 5
				],
				scheduledAt,
				durationMinutes: 30,
				notes: i % 4 === 0 ? 'Bring previous clinic card' : '',
				status: scheduledAt < now ? (i % 9 === 0 ? 'no-show' : 'completed') : 'scheduled',
				smsReminderSent: i % 3 === 0,
				createdAt: daysAgo(14),
				syncStatus: 'synced',
				updatedAt: daysAgo(1)
			};
		});

	const pregnancyRecords: LocalPregnancyRecord[] = patients
		.filter((p) => p.isPregnant && !p.deleted)
		.map((patient, i) => {
			const lmp = daysAgo(20 + i * 14);
			return {
				id: sid(`pregnancy:${i}`),
				patientId: patient.id,
				phcId,
				lmpDate: lmp,
				eddDate: lmp + 280 * DAY,
				status: 'active',
				gravida: 1 + (i % 4),
				parity: i % 3,
				createdAt: lmp,
				updatedAt: daysAgo(1),
				syncStatus: 'synced'
			};
		});

	const triageRules: LocalTriageRule[] = CANONICAL_TRIAGE_RULES.map((rule, i) => ({
		id: sid(`triage-rule:${i}`),
		phcId,
		field: rule.field,
		operator: rule.operator,
		threshold: rule.threshold,
		resultingLevel: rule.resultingLevel,
		reasonTemplate: rule.reasonTemplate,
		requiresPregnant: rule.requiresPregnant,
		active: true,
		version: 1,
		syncStatus: 'synced',
		updatedAt: daysAgo(30)
	}));

	const serverOnly: ServerOnlyRecords = {
		devices: [
			{
				id: sid('device:0'),
				phcId,
				name: 'Triage Tablet 1',
				macAddress: `00:1A:2B:3C:4D:${profile.slug.length.toString(16).padStart(2, '0')}`,
				role: 'triage',
				status: 'approved'
			},
			{
				id: sid('device:1'),
				phcId,
				name: 'Nurse Station Desktop',
				macAddress: '00:1A:2B:3C:4D:11',
				role: 'kiosk',
				status: 'approved'
			},
			{
				id: sid('device:2'),
				phcId,
				name: 'Doctor Tablet 2',
				macAddress: '00:1A:2B:3C:4D:12',
				role: 'doctor_tablet',
				status: 'pending'
			},
			{
				id: sid('device:3'),
				phcId,
				name: 'Pharmacy Terminal',
				macAddress: '00:1A:2B:3C:4D:13',
				role: 'pharmacy_terminal',
				status: 'revoked'
			}
		],
		smsInbox: patients.slice(0, 8).map((patient, i) => ({
			id: sid(`sms:${i}`),
			phcId,
			patientId: patient.id,
			fromPhone: patient.phone ?? '',
			message: [
				'Thank you, I will come for my appointment.',
				'Can I come tomorrow instead?',
				'My child still has fever.',
				'Please confirm my ANC date.',
				'I need my test result.',
				'OK',
				'Where is the clinic located?',
				'Thank you for the reminder.'
			][i],
			isRead: i % 3 === 0
		})),
		auditLog: Array.from({ length: 12 }, (_, i) => ({
			id: sid(`audit:${i}`),
			phcId,
			staffId: staff[i % staff.length].id,
			action: ['permission.grant', 'permission.revoke', 'staff.update', 'role.change'][i % 4],
			entityType: ['permissions', 'permissions', 'staff', 'staff'][i % 4],
			entityId: staff[(i + 1) % staff.length].id,
			metadata: JSON.stringify({ event: i + 1, phc: profile.slug })
		}))
	};

	return {
		profile,
		phcId,
		authUsers,
		staff,
		families,
		patients,
		encounters,
		vitalsRecords,
		queueTickets,
		pharmacyInventory,
		prescriptions,
		labRequests,
		restockRequests,
		reminders,
		appointments,
		pregnancyRecords,
		triageRules,
		serverOnly
	};
}

export function buildAllFixtures(now = Date.now()): FixtureSet[] {
	return PHC_PROFILES.map((profile) => buildFixtures(profile, now));
}
