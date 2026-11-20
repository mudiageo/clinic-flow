import { command, getRequestEvent, query } from '$app/server';
import { error } from '@sveltejs/kit';
import { and, desc, eq, inArray } from 'drizzle-orm';
import * as v from 'valibot';
import { recordAudit } from '#lib/server/audit.ts';
import { database, getTable } from '#lib/server/db/queries/_core.ts';
import { submitNhisClaim as deliverClaim } from '#lib/server/integrations/nhis-provider.ts';
import { requirePermission } from '#lib/server/permissions.ts';

export interface NhisClaimRow {
	id: string;
	claimReference: string;
	status: string;
	providerMode: string;
	providerReference: string | null;
	enrolleeNumber: string | null;
	authorizationCode: string | null;
	note: string | null;
	submittedAt: string | null;
	createdAt: string;
	patientName: string;
	clinicId: string;
	visitDate: string | null;
}

export interface NhisEncounterOption {
	id: string;
	patientName: string;
	clinicId: string;
	visitDate: string | null;
	chiefComplaint: string | null;
}

const iso = (value: unknown): string | null =>
	value instanceof Date ? value.toISOString() : typeof value === 'string' ? value : null;

/** Safely reads a string column without ever stringifying an object into "[object Object]". */
const textValue = (value: unknown): string | null => (typeof value === 'string' ? value : null);

async function nameMaps(patientIds: string[], encounterIds: string[]) {
	const patientsTable = getTable('patients');
	const encountersTable = getTable('encounters');
	const [patients, encounters] = await Promise.all([
		patientIds.length
			? database
					.select({
						id: patientsTable.id,
						fullName: patientsTable.fullName,
						clinicId: patientsTable.clinicId
					})
					.from(patientsTable)
					.where(inArray(patientsTable.id, patientIds))
			: Promise.resolve([]),
		encounterIds.length
			? database
					.select({ id: encountersTable.id, visitDate: encountersTable.visitDate })
					.from(encountersTable)
					.where(inArray(encountersTable.id, encounterIds))
			: Promise.resolve([])
	]);
	return {
		patients: new Map(
			patients.map((row: { id: string; fullName: string; clinicId: string }) => [row.id, row])
		),
		encounters: new Map(encounters.map((row: { id: string; visitDate: unknown }) => [row.id, row]))
	};
}

/** Durable, PHC-scoped claim queue. No status is inferred from a toast. */
export const getNhisClaims = query(async (): Promise<NhisClaimRow[]> => {
	await requirePermission('manage:nhis');
	const event = getRequestEvent();
	if (!event.locals.phcId) return [];

	const table = getTable('nhisClaims');
	const rows = await database
		.select()
		.from(table)
		.where(eq(table.phcId, event.locals.phcId))
		.orderBy(desc(table.createdAt))
		.limit(100);
	if (!rows.length) return [];

	const maps = await nameMaps(
		rows.map((row: { patientId: string | null }) => row.patientId).filter(Boolean) as string[],
		rows.map((row: { encounterId: string | null }) => row.encounterId).filter(Boolean) as string[]
	);

	return rows.map((row: Record<string, unknown>) => {
		const patient = maps.patients.get(String(row.patientId)) as
			| { fullName: string; clinicId: string }
			| undefined;
		const encounter = maps.encounters.get(String(row.encounterId)) as
			| { visitDate: unknown }
			| undefined;
		return {
			id: String(row.id),
			claimReference: String(row.claimReference),
			status: String(row.status),
			providerMode: String(row.providerMode),
			providerReference: textValue(row.providerReference),
			enrolleeNumber: textValue(row.enrolleeNumber),
			authorizationCode: textValue(row.authorizationCode),
			note: textValue(row.note),
			submittedAt: iso(row.submittedAt),
			createdAt: iso(row.createdAt) ?? new Date().toISOString(),
			patientName: patient?.fullName ?? 'Unknown patient',
			clinicId: patient?.clinicId ?? 'N/A',
			visitDate: iso(encounter?.visitDate)
		};
	});
});

/** Recent real encounters that can be turned into a manual claim packet. */
export const getNhisEncounterOptions = query(async (): Promise<NhisEncounterOption[]> => {
	await requirePermission('manage:nhis');
	const event = getRequestEvent();
	if (!event.locals.phcId) return [];

	const encountersTable = getTable('encounters');
	const patientsTable = getTable('patients');
	const encounters = await database
		.select({
			id: encountersTable.id,
			patientId: encountersTable.patientId,
			visitDate: encountersTable.visitDate,
			chiefComplaint: encountersTable.chiefComplaint
		})
		.from(encountersTable)
		.where(eq(encountersTable.phcId, event.locals.phcId))
		.orderBy(desc(encountersTable.visitDate))
		.limit(50);
	if (!encounters.length) return [];

	const maps = await nameMaps(
		[],
		encounters.map((row: { id: string }) => row.id)
	);
	const patientIds = [...new Set(encounters.map((row: { patientId: string }) => row.patientId))];
	const patientRows = patientIds.length
		? await database
				.select({
					id: patientsTable.id,
					fullName: patientsTable.fullName,
					clinicId: patientsTable.clinicId
				})
				.from(patientsTable)
				.where(inArray(patientsTable.id, patientIds))
		: [];
	const patientMap = new Map(
		patientRows.map((row: { id: string; fullName: string; clinicId: string }) => [row.id, row])
	);

	return encounters.map((row: Record<string, unknown>) => {
		const patient = patientMap.get(String(row.patientId)) as
			| { fullName: string; clinicId: string }
			| undefined;
		const encounter = maps.encounters.get(String(row.id)) as { visitDate: unknown } | undefined;
		return {
			id: String(row.id),
			patientName: patient?.fullName ?? 'Unknown patient',
			clinicId: patient?.clinicId ?? 'N/A',
			visitDate: iso(encounter?.visitDate) ?? iso(row.visitDate),
			chiefComplaint: textValue(row.chiefComplaint)
		};
	});
});

const createClaimSchema = v.object({
	encounterId: v.pipe(v.string(), v.uuid()),
	enrolleeNumber: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(80))),
	authorizationCode: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(80)))
});

/** Builds a claim packet from durable encounter/patient/vitals data. */
export const createNhisClaim = command(createClaimSchema, async (input) => {
	await requirePermission('manage:nhis');
	const event = getRequestEvent();
	const phcId = event.locals.phcId;
	if (!phcId) error(401, 'Unauthorized');

	const encountersTable = getTable('encounters');
	const encounters = await database
		.select()
		.from(encountersTable)
		.where(and(eq(encountersTable.id, input.encounterId), eq(encountersTable.phcId, phcId)))
		.limit(1);
	const encounter = encounters[0];
	if (!encounter) error(404, 'Encounter not found');

	const patientsTable = getTable('patients');
	const patientRows = await database
		.select()
		.from(patientsTable)
		.where(eq(patientsTable.id, encounter.patientId))
		.limit(1);
	const patient = patientRows[0];
	if (!patient) error(404, 'Patient not found');

	const vitalsTable = getTable('vitalsRecords');
	const vitals = await database
		.select()
		.from(vitalsTable)
		.where(eq(vitalsTable.encounterId, encounter.id))
		.orderBy(desc(vitalsTable.recordedAt))
		.limit(1);

	const packet = {
		claimReference: `local-claim:${crypto.randomUUID()}`,
		generatedAt: new Date().toISOString(),
		patient: {
			clinicId: patient.clinicId,
			fullName: patient.fullName,
			sex: patient.sex,
			dateOfBirth: iso(patient.dob),
			estimatedAge: patient.estimatedAge ?? null
		},
		encounter: {
			id: encounter.id,
			visitDate: iso(encounter.visitDate),
			chiefComplaint: encounter.chiefComplaint ?? null,
			clinicalNotes: encounter.doctorNotes ?? null
		},
		vitals: vitals[0]
			? {
					recordedAt: iso(vitals[0].recordedAt),
					temperatureCelsius: vitals[0].temperatureCelsius,
					systolicBp: vitals[0].systolicBp,
					diastolicBp: vitals[0].diastolicBp,
					pulseBpm: vitals[0].pulseBpm,
					spo2Percent: vitals[0].spo2Percent,
					triageLevel: vitals[0].triageLevel
				}
			: null,
		enrolleeNumber: input.enrolleeNumber ?? null,
		authorizationCode: input.authorizationCode ?? null,
		submissionNote:
			'Build the HMO-specific claim file from this packet and submit it through the HMO portal.'
	};

	const table = getTable('nhisClaims');
	const now = new Date();
	const created = await database
		.insert(table)
		.values({
			phcId,
			encounterId: encounter.id,
			patientId: patient.id,
			createdByStaffId: event.locals.staffId ?? null,
			claimReference: packet.claimReference,
			status: 'draft',
			providerMode: 'console',
			enrolleeNumber: input.enrolleeNumber ?? null,
			authorizationCode: input.authorizationCode ?? null,
			claimData: JSON.stringify(packet),
			createdAt: now,
			updatedAt: now
		})
		.returning({ id: table.id });

	await recordAudit({
		phcId,
		staffId: event.locals.staffId ?? null,
		action: 'nhis.claim.create',
		entityType: 'nhis_claim',
		entityId: String(created[0]?.id ?? ''),
		metadata: { claimReference: packet.claimReference }
	});

	return { success: true, claimId: String(created[0]?.id ?? '') };
});

const submitSchema = v.object({
	claimId: v.pipe(v.string(), v.uuid()),
	note: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(280)))
});

/**
 * Records a manual submission, or posts to a private endpoint when configured.
 * Console mode is never presented as a delivered claim.
 */
export const submitNhisClaim = command(submitSchema, async (input) => {
	await requirePermission('manage:nhis');
	const event = getRequestEvent();
	const phcId = event.locals.phcId;
	if (!phcId) error(401, 'Unauthorized');

	const table = getTable('nhisClaims');
	const rows = await database
		.select()
		.from(table)
		.where(and(eq(table.id, input.claimId), eq(table.phcId, phcId)))
		.limit(1);
	const claim = rows[0];
	if (!claim) error(404, 'Claim not found');
	if (!['draft', 'ready', 'failed'].includes(String(claim.status))) {
		error(400, 'This claim has already been submitted.');
	}

	let payload: Record<string, unknown>;
	try {
		payload = JSON.parse(String(claim.claimData)) as Record<string, unknown>;
	} catch {
		error(500, 'Claim packet is invalid.');
	}

	const result = await deliverClaim({
		claimReference: String(claim.claimReference),
		encounterId: claim.encounterId ? String(claim.encounterId) : null,
		patientId: claim.patientId ? String(claim.patientId) : null,
		payload
	});

	if (!result.ok) {
		error(502, result.error);
	}

	await database
		.update(table)
		.set({
			status: 'submitted',
			providerMode: result.mode,
			providerReference: result.data.providerReference,
			note: input.note ?? null,
			submittedAt: new Date(),
			updatedAt: new Date()
		})
		.where(eq(table.id, input.claimId));

	await recordAudit({
		phcId,
		staffId: event.locals.staffId ?? null,
		action: 'nhis.claim.submit',
		entityType: 'nhis_claim',
		entityId: input.claimId,
		metadata: { mode: result.mode, claimReference: String(claim.claimReference) }
	});

	return {
		success: true,
		mode: result.mode,
		reason: result.mode === 'console' ? result.reason : null,
		reference: result.data.reference
	};
});

const statusSchema = v.object({
	claimId: v.pipe(v.string(), v.uuid()),
	status: v.picklist(['acknowledged', 'paid', 'failed']),
	note: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(280)))
});

/** Records the outcome reported by the HMO after manual reconciliation. */
export const updateNhisClaimStatus = command(statusSchema, async (input) => {
	await requirePermission('manage:nhis');
	const event = getRequestEvent();
	const phcId = event.locals.phcId;
	if (!phcId) error(401, 'Unauthorized');

	const table = getTable('nhisClaims');
	const rows = await database
		.select({ status: table.status })
		.from(table)
		.where(and(eq(table.id, input.claimId), eq(table.phcId, phcId)))
		.limit(1);
	if (!rows.length) error(404, 'Claim not found');
	if (String(rows[0].status) !== 'submitted')
		error(400, 'Only submitted claims can be reconciled.');

	await database
		.update(table)
		.set({ status: input.status, note: input.note ?? null, updatedAt: new Date() })
		.where(eq(table.id, input.claimId));

	await recordAudit({
		phcId,
		staffId: event.locals.staffId ?? null,
		action: 'nhis.claim.reconcile',
		entityType: 'nhis_claim',
		entityId: input.claimId,
		metadata: { status: input.status }
	});

	return { success: true };
});
