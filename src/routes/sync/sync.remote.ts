import { query, command, getRequestEvent } from '$app/server';
import { error } from '@sveltejs/kit';
import * as v from 'valibot';
import { and, asc, desc, eq, gt, inArray, lte, sql } from 'drizzle-orm';
import { database, getTable } from '#lib/server/db/queries/_core.ts';
import { toClientRow, toServerRow, SYNC_ENTITY_TABLE } from '#lib/seed/adapters.ts';
import { realtimeHub, syncTopics } from '#lib/server/realtime/hub.ts';
import { canWriteOutreach, normalizeOutreachPayload } from '#lib/outreach/policy.ts';
import {
	canWriteClinical,
	clinicalFeatureEnabled,
	clinicalWritePolicy,
	normalizeClinicalPayload
} from '#lib/clinical/policy.ts';
import { appendSyncOperation } from '#lib/server/sync/outbox.ts';
import { finalizeChangeBatch } from '#lib/sync/change-feed.ts';
import { checkTenantScope, resolvesViaPatient } from '#lib/sync/tenant-scope.ts';
import {
	extractEncounterDependency,
	orderOperationsForDependencies
} from '#lib/sync/operation-dependencies.ts';

const pharmacyInventory = getTable('pharmacyInventory');
const patients = getTable('patients');
const encounters = getTable('encounters');
const queueTickets = getTable('queueTickets');
const staff = getTable('staff');
const syncOperations = getTable('syncOperations');
const phcs = getTable('phcs');

const tableMap: Record<string, ReturnType<typeof getTable>> = {
	patients,
	queueTickets,
	vitalsRecords: getTable('vitalsRecords'),
	pharmacyInventory,
	reminders: getTable('reminders'),
	triageRules: getTable('triageRules'),
	prescriptions: getTable('prescriptions'),
	encounters: getTable('encounters'),
	labRequests: getTable('labRequests'),
	restockRequests: getTable('restockRequests'),
	appointments: getTable('appointments'),
	pregnancyRecords: getTable('pregnancyRecords'),
	ancVisits: getTable('ancVisits'),
	staff,
	families: getTable('families'),
	outreachRecords: getTable('outreachRecords'),
	immunizationRecords: getTable('immunizationRecords'),
	temperatureLogs: getTable('temperatureLogs')
};

interface ServerSyncChange {
	id: string;
	phcId: string;
	deviceId: string;
	operationId: string;
	version: number;
	entityType: string;
	entityId: string;
	operation: string;
	payload: string;
	clientUpdatedAt: Date;
	serverReceivedAt: Date;
}

function requireAuth() {
	const event = getRequestEvent();
	if (!event?.locals.user) {
		error(401, 'UNAUTHORIZED');
	}
	return event.locals;
}

function toTimestamp(value: unknown): number {
	if (value instanceof Date) return value.getTime();
	if (typeof value === 'number' && Number.isFinite(value)) return value;
	if (typeof value === 'string') {
		const parsed = Date.parse(value);
		if (!Number.isNaN(parsed)) return parsed;
	}
	return 0;
}

/**
 * Patient-linked entities (vitals, prescriptions) have no phcId column; their
 * tenant comes from the patient. Prefer an existing record's patient so a sync
 * write cannot reassign a record to another patient.
 */
async function resolvePatientPhc(
	cleanPayload: Record<string, unknown>,
	existing: Record<string, unknown> | undefined
): Promise<string | null> {
	const patientId =
		typeof existing?.patientId === 'string'
			? existing.patientId
			: typeof cleanPayload.patientId === 'string'
				? cleanPayload.patientId
				: null;
	if (!patientId) return null;
	const [patient] = await database
		.select({ phcId: patients.phcId })
		.from(patients)
		.where(eq(patients.id, patientId))
		.limit(1);
	return patient?.phcId ?? null;
}

const operationSchema = v.object({
	localId: v.number(),
	operationId: v.optional(v.pipe(v.string(), v.maxLength(160))),
	entityType: v.string(),
	entityId: v.string(),
	operation: v.picklist(['create', 'update', 'delete', 'delta']),
	payload: v.any(),
	timestamp: v.number(),
	baseVersion: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0))),
	deviceId: v.string(),
	phcId: v.string()
});

interface AcceptedVersion {
	localId: number;
	entityType: string;
	entityId: string;
	version: number;
}

function operationIdFor(op: v.InferOutput<typeof operationSchema>): string {
	return op.operationId ?? `${op.deviceId}:${op.localId}:${op.timestamp}`;
}

async function findOperation(operationId: string) {
	const [existing] = await database
		.select({ version: syncOperations.version })
		.from(syncOperations)
		.where(eq(syncOperations.operationId, operationId))
		.limit(1);
	return existing ?? null;
}

async function latestEntityVersion(phcId: string, entityType: string, entityId: string) {
	const [latest] = await database
		.select({ version: syncOperations.version })
		.from(syncOperations)
		.where(
			and(
				eq(syncOperations.phcId, phcId),
				eq(syncOperations.entityType, entityType),
				eq(syncOperations.entityId, entityId)
			)
		)
		.orderBy(desc(syncOperations.version))
		.limit(1);
	return Number(latest?.version ?? 0);
}

export const pushOperations = command(v.array(operationSchema), async (operations) => {
	const locals = requireAuth();

	// PHC guard: all operations must belong to the authenticated user's PHC.
	// Prevents FK violations from stale local data after server reset/re-seed.
	const sessionPhcId = locals.phcId;
	if (!sessionPhcId) {
		// User has no PHC (e.g., superadmin without assignment) — reject all writes.
		return {
			accepted: [],
			acceptedVersions: [],
			conflicts: operations.map((op) => ({
				localId: op.localId,
				reason: 'user-has-no-phc-assignment'
			}))
		};
	}

	// Validate all incoming operations carry the correct PHC.
	for (const op of operations) {
		if (op.phcId !== sessionPhcId) {
			// Rewrite the operation's PHC to the session's PHC instead of rejecting.
			// This handles stale local data after server reseed.
			op.phcId = sessionPhcId;
		}
	}

	// Feature flags are authoritative on the server. A client cannot enable a
	// disabled clinical module by skipping its own feature check.
	const [featureFlags] = await database
		.select({
			immunizationEnabled: phcs.immunizationEnabled,
			coldChainEnabled: phcs.coldChainEnabled,
			maternalHealthEnabled: phcs.maternalHealthEnabled
		})
		.from(phcs)
		.where(eq(phcs.id, sessionPhcId))
		.limit(1);

	const accepted: number[] = [];
	const acceptedVersions: AcceptedVersion[] = [];
	const conflicts: unknown[] = [];
	const acceptedEntityVersions = new Map<string, number>();

	// Parents first: PostgreSQL cannot satisfy a child FK from an encounter that
	// is still queued later in the same client batch.
	for (const op of orderOperationsForDependencies(operations)) {
		const operationId = operationIdFor(op);
		const duplicate = await findOperation(operationId);
		if (duplicate) {
			accepted.push(op.localId);
			acceptedVersions.push({
				localId: op.localId,
				entityType: op.entityType,
				entityId: op.entityId,
				version: Number(duplicate.version)
			});
			continue;
		}

		if (op.entityType === 'outreachRecords' && !canWriteOutreach(locals.role, locals.permissions)) {
			conflicts.push({ localId: op.localId, reason: 'missing-outreach-permission' });
			continue;
		}

		// Clinical records require both a permission and an enabled feature flag.
		// This is the authoritative gate; client-side flags are not authorization.
		const clinicalPermissionOk = canWriteClinical(op.entityType, locals.role, locals.permissions);
		const clinicalFlagOk = clinicalFeatureEnabled(op.entityType, featureFlags);
		if (!clinicalPermissionOk || !clinicalFlagOk) {
			conflicts.push({
				localId: op.localId,
				reason: !clinicalPermissionOk ? 'missing-clinical-permission' : 'clinical-feature-disabled'
			});
			continue;
		}

		if (op.entityType === 'pharmacyInventory' && op.operation === 'delta') {
			const payload = op.payload as Record<string, unknown>;
			const itemId =
				typeof payload.itemId === 'string'
					? payload.itemId
					: typeof payload.id === 'string'
						? payload.id
						: '';
			const delta =
				typeof payload.delta === 'number'
					? payload.delta
					: typeof payload.quantity === 'number'
						? -payload.quantity
						: Number.NaN;
			const inventoryItem = itemId
				? (
						await database
							.select({ phcId: pharmacyInventory.phcId })
							.from(pharmacyInventory)
							.where(eq(pharmacyInventory.id, itemId))
							.limit(1)
					)[0]
				: null;
			if (inventoryItem?.phcId !== sessionPhcId) {
				conflicts.push({ localId: op.localId, reason: 'tenant-scope-mismatch' });
				continue;
			}

			if (itemId && Number.isFinite(delta) && delta !== 0) {
				const normalizedPayload = { itemId, delta };
				let version: number;
				try {
					version = await database.transaction(async (tx: typeof database) => {
						const allocated = await appendSyncOperation(tx, {
							phcId: op.phcId,
							deviceId: op.deviceId,
							operationId,
							entityType: op.entityType,
							entityId: itemId,
							operation: 'delta',
							payload: normalizedPayload,
							clientUpdatedAt: op.timestamp
						});
						const [updatedInventory] = await tx
							.update(pharmacyInventory)
							.set({ currentStock: sql`${pharmacyInventory.currentStock} + ${delta}` })
							.where(eq(pharmacyInventory.id, itemId))
							.returning({ currentStock: pharmacyInventory.currentStock });
						if (!updatedInventory) throw new Error('Inventory item disappeared during sync');
						await tx
							.update(syncOperations)
							.set({
								payload: JSON.stringify({
									...normalizedPayload,
									currentStock: Number(updatedInventory.currentStock)
								})
							})
							.where(eq(syncOperations.operationId, operationId));
						return allocated;
					});
				} catch (cause) {
					const existingOperation = await findOperation(operationId);
					if (!existingOperation) {
						console.error('Inventory delta sync failed:', cause);
						conflicts.push({ localId: op.localId, reason: 'db-error' });
						continue;
					}
					version = Number(existingOperation.version);
				}
				accepted.push(op.localId);
				acceptedVersions.push({
					localId: op.localId,
					entityType: op.entityType,
					entityId: itemId,
					version
				});
				realtimeHub.publish(syncTopics.phc(op.phcId), {
					entityType: op.entityType,
					entityId: itemId,
					operation: 'update'
				});
			} else {
				conflicts.push({ localId: op.localId, reason: 'invalid-inventory-delta' });
			}
			continue;
		}
		if (op.operation === 'delta') {
			conflicts.push({ localId: op.localId, reason: 'unsupported-delta-operation' });
			continue;
		}

		if (op.entityType === 'profile') {
			const payload = op.payload as Record<string, unknown>;
			if (locals.staffId !== op.entityId) {
				conflicts.push({ localId: op.localId, reason: 'profile-scope-mismatch' });
				continue;
			}
			if (typeof payload.name === 'string' && payload.name) {
				await database
					.update(staff)
					.set({ fullName: payload.name })
					.where(eq(staff.id, op.entityId));
				// Also update Better Auth user using the authUserId relationship
				const staffMember = await database.query.staff.findFirst({
					where: eq(staff.id, op.entityId)
				});
				if (staffMember) {
					await database.execute(
						sql`UPDATE "user" SET name = ${payload.name} WHERE id = ${staffMember.authUserId}`
					);
				}
				accepted.push(op.localId);
			}
			continue;
		}

		if (op.entityType === 'preferences') {
			const payload = op.payload as unknown;
			if (locals.staffId !== op.entityId) {
				conflicts.push({ localId: op.localId, reason: 'profile-scope-mismatch' });
				continue;
			}
			await database
				.update(staff)
				.set({ preferences: JSON.stringify(payload) })
				.where(eq(staff.id, op.entityId));
			accepted.push(op.localId);
			continue;
		}

		const tableObj = tableMap[op.entityType];
		if (!tableObj) {
			console.warn(
				`Unknown entity type: ${op.entityType} (expected one of ${Object.keys(SYNC_ENTITY_TABLE).join(', ')})`
			);
			conflicts.push({ localId: op.localId, reason: 'unknown-entity-type' });
			continue;
		}

		const [existing] = (await database
			.select()
			.from(tableObj)
			.where(eq(tableObj.id, op.entityId))
			.limit(1)) as Record<string, unknown>[];

		let payload = { ...(op.payload as Record<string, unknown>) };
		if (op.entityType === 'outreachRecords') {
			if (!locals.staffId) {
				conflicts.push({ localId: op.localId, reason: 'missing-staff-identity' });
				continue;
			}
			if (op.operation !== 'delete') {
				const normalizedPayload = normalizeOutreachPayload(payload, op.operation === 'update');
				if (!normalizedPayload) {
					conflicts.push({ localId: op.localId, reason: 'invalid-outreach-payload' });
					continue;
				}
				payload = normalizedPayload;
			}
			payload.phcId = sessionPhcId;
			payload.recordedByStaffId = existing?.recordedByStaffId ?? locals.staffId;
		}
		// Clinical records must be attributed to the signed-in staff member and
		// validated before they reach the database. Neither the recorder identity
		// nor the clinical values are trusted from the client.
		if (clinicalWritePolicy(op.entityType)) {
			if (!locals.staffId) {
				conflicts.push({ localId: op.localId, reason: 'missing-staff-identity' });
				continue;
			}
			const normalized = normalizeClinicalPayload(
				op.entityType,
				payload,
				op.operation === 'update'
			);
			if (!normalized) {
				conflicts.push({ localId: op.localId, reason: 'invalid-clinical-payload' });
				continue;
			}
			payload = {
				...payload,
				...normalized,
				phcId: sessionPhcId,
				recordedByStaffId: existing?.recordedByStaffId ?? locals.staffId
			};
		}
		// Compatibility shim: map client field names/types to the server row.
		// See docs/data-model/client-server-field-mapping.md.
		const cleanPayload = toServerRow(op.entityType, payload);

		const viaPatient = resolvesViaPatient(op.entityType);
		const patientPhcId = viaPatient ? await resolvePatientPhc(cleanPayload, existing) : null;
		const scopeResult = checkTenantScope({
			entityType: op.entityType,
			existingPhcId: typeof existing?.phcId === 'string' ? existing.phcId : undefined,
			patientPhcId,
			sessionPhcId
		});
		if (scopeResult !== 'ok') {
			conflicts.push({ localId: op.localId, reason: scopeResult });
			continue;
		}

		// The authenticated session is the only authority for tenant scope. Never
		// trust a client-supplied phcId; force every written record under the
		// session PHC. The outbox payload is rewritten too so other devices cache
		// the correct PHC.
		if (!viaPatient) {
			payload.phcId = sessionPhcId;
			cleanPayload.phcId = sessionPhcId;
		}

		const entityKey = `${op.entityType}:${op.entityId}`;
		const chainedVersion = acceptedEntityVersions.get(entityKey);
		const serverVersion =
			chainedVersion ?? (await latestEntityVersion(sessionPhcId, op.entityType, op.entityId));
		const effectiveBaseVersion = chainedVersion ?? op.baseVersion;
		const serverRecord = existing ? toClientRow(op.entityType, existing) : null;

		if (existing && effectiveBaseVersion !== undefined && effectiveBaseVersion !== serverVersion) {
			conflicts.push({
				localId: op.localId,
				reason: 'server-version-conflict',
				serverVersion,
				serverRecord
			});
			continue;
		}
		if (
			existing &&
			effectiveBaseVersion === undefined &&
			op.timestamp < toTimestamp(existing.updatedAt)
		) {
			conflicts.push({
				localId: op.localId,
				reason: 'timestamp-conflict',
				serverVersion,
				serverRecord
			});
			continue;
		}

		if (!existing && op.operation === 'update') {
			conflicts.push({
				localId: op.localId,
				reason: 'missing-server-record',
				serverVersion,
				serverRecord: null
			});
			continue;
		}
		if (existing && op.operation === 'create') {
			conflicts.push({
				localId: op.localId,
				reason: 'record-already-exists',
				serverVersion,
				serverRecord
			});
			continue;
		}

		if (
			op.entityType === 'queueTickets' &&
			existing &&
			existing.triageLevel === 'red' &&
			payload.triageLevel &&
			payload.triageLevel !== 'red'
		) {
			conflicts.push({
				localId: op.localId,
				reason: 'urgency-override-blocked',
				serverVersion,
				serverRecord
			});
			continue;
		}

		const encounterDependency = extractEncounterDependency(op);
		let backfilledEncounterId: string | null = null;

		try {
			const version = await database.transaction(async (tx: typeof database) => {
				// Legacy clients invented an encounterId without writing the encounter.
				// Repair it in this same transaction so the child FK can be satisfied.
				if (encounterDependency) {
					const patientId =
						typeof existing?.patientId === 'string'
							? existing.patientId
							: typeof cleanPayload.patientId === 'string'
								? cleanPayload.patientId
								: encounterDependency.patientId;
					if (!patientId) {
						throw new Error('Encounter-linked record is missing its patient');
					}

					const [encounter] = await tx
						.select({ id: encounters.id })
						.from(encounters)
						.where(eq(encounters.id, encounterDependency.encounterId))
						.limit(1);

					if (!encounter) {
						const visitDate =
							(cleanPayload.recordedAt instanceof Date ? cleanPayload.recordedAt : null) ??
							(cleanPayload.createdAt instanceof Date ? cleanPayload.createdAt : null) ??
							new Date(op.timestamp);
						const now = new Date();
						await tx.insert(encounters).values({
							id: encounterDependency.encounterId,
							patientId,
							phcId: sessionPhcId,
							recordedByStaffId: locals.staffId,
							visitDate,
							updatedAt: now
						});
						await appendSyncOperation(tx, {
							phcId: sessionPhcId,
							deviceId: op.deviceId,
							operationId: `encounter-backfill:${encounterDependency.encounterId}`,
							entityType: 'encounters',
							entityId: encounterDependency.encounterId,
							operation: 'create',
							payload: {
								id: encounterDependency.encounterId,
								patientId,
								phcId: sessionPhcId,
								recordedByStaffId: locals.staffId,
								visitDate: visitDate.getTime(),
								createdAt: visitDate.getTime(),
								updatedAt: now.getTime(),
								syncStatus: 'synced'
							},
							clientUpdatedAt: now
						});
						backfilledEncounterId = encounterDependency.encounterId;
					}
				}

				const allocated = await appendSyncOperation(tx, {
					phcId: op.phcId,
					deviceId: op.deviceId,
					operationId,
					entityType: op.entityType,
					entityId: op.entityId,
					operation: op.operation,
					// Preserve the original client payload so other devices get the
					// client-shaped patch they expect.
					payload,
					clientUpdatedAt: op.timestamp
				});
				if (op.operation === 'delete') {
					if (existing) await tx.delete(tableObj).where(eq(tableObj.id, op.entityId));
				} else if (existing) {
					// Update payloads are intentionally partial patches. Sending one through
					// INSERT ... ON CONFLICT fails before the conflict handler runs because
					// PostgreSQL validates required columns on the proposed insert row first.
					await tx.update(tableObj).set(cleanPayload).where(eq(tableObj.id, op.entityId));
				} else {
					await tx.insert(tableObj).values({ ...cleanPayload, id: op.entityId });
				}
				return allocated;
			});

			accepted.push(op.localId);
			acceptedVersions.push({
				localId: op.localId,
				entityType: op.entityType,
				entityId: op.entityId,
				version
			});
			acceptedEntityVersions.set(entityKey, version);
			if (backfilledEncounterId) {
				realtimeHub.publish(syncTopics.phc(op.phcId), {
					entityType: 'encounters',
					entityId: backfilledEncounterId,
					operation: 'create'
				});
			}
			realtimeHub.publish(syncTopics.phc(op.phcId), {
				entityType: op.entityType,
				entityId: op.entityId,
				operation:
					op.operation === 'delete'
						? 'delete'
						: !existing && op.operation === 'create'
							? 'create'
							: 'update'
			});
		} catch (cause) {
			const existingOperation = await findOperation(operationId);
			if (existingOperation) {
				const version = Number(existingOperation.version);
				accepted.push(op.localId);
				acceptedVersions.push({
					localId: op.localId,
					entityType: op.entityType,
					entityId: op.entityId,
					version
				});
				acceptedEntityVersions.set(entityKey, version);
			} else {
				console.error(`Push Error for ${op.entityType}:`, cause);
				conflicts.push({ localId: op.localId, reason: 'db-error' });
			}
		}
	}

	return { accepted, acceptedVersions, conflicts };
});

export const pullChanges = query(
	v.object({
		phcId: v.string(),
		since: v.pipe(v.number(), v.integer(), v.minValue(0))
	}),
	async ({ phcId, since }) => {
		const locals = requireAuth();
		if (!locals.phcId || locals.phcId !== phcId) error(403, 'PHC scope mismatch');
		const [scope] = await database
			.select({ syncVersion: phcs.syncVersion })
			.from(phcs)
			.where(eq(phcs.id, phcId))
			.limit(1);
		if (!scope) error(404, 'PHC not found');
		const highWatermark = Number(scope.syncVersion);
		if (!Number.isSafeInteger(highWatermark) || highWatermark < since) {
			error(409, 'Invalid sync cursor state');
		}

		// Include the requesting device's operations. Creates/updates are idempotent,
		// and inventory deltas carry their authoritative resulting stock. Replaying
		// every version is required to bootstrap server-version metadata safely.
		const changes = (await database
			.select()
			.from(syncOperations)
			.where(
				and(
					eq(syncOperations.phcId, phcId),
					gt(syncOperations.version, since),
					lte(syncOperations.version, highWatermark)
				)
			)
			.orderBy(asc(syncOperations.version))
			.limit(500)) as ServerSyncChange[];
		const batch = finalizeChangeBatch(changes, { since, highWatermark });

		// Parse payloads
		const parsedChanges = changes.map((c) => ({
			...c,
			payload: JSON.parse(c.payload)
		}));

		return { ...batch, changes: parsedChanges };
	}
);

export const getQueueUpdates = query.live(
	v.string(), // phcId
	async function* (phcId) {
		const locals = requireAuth();
		if (!locals.phcId || locals.phcId !== phcId) error(403, 'PHC scope mismatch');
		const request = getRequestEvent().request;
		const readQueue = async () => {
			return await database
				.select()
				.from(queueTickets)
				.where(
					and(
						eq(queueTickets.phcId, phcId),
						inArray(queueTickets.status, ['waiting', 'called', 'in_progress'])
					)
				);
		};

		const initial = await readQueue();
		let lastEmitted = JSON.stringify(initial);
		yield initial;

		for await (const signal of realtimeHub.subscribe([syncTopics.phc(phcId)], {
			signal: request.signal,
			heartbeatMs: 30_000
		})) {
			const refreshedLocals = requireAuth();
			if (refreshedLocals.phcId !== phcId) error(403, 'PHC scope changed');
			if (signal.operation !== 'reconcile' && signal.entityType !== 'queueTickets') continue;

			const tickets = await readQueue();
			const snapshot = JSON.stringify(tickets);
			if (snapshot !== lastEmitted) {
				lastEmitted = snapshot;
				yield tickets;
			}
		}
	}
);

export const getPhcSettings = query(v.string(), async (phcId) => {
	const locals = requireAuth();
	if (!locals.phcId || locals.phcId !== phcId) error(403, 'PHC scope mismatch');
	const [phc] = await database.select().from(phcs).where(eq(phcs.id, phcId)).limit(1);
	return phc || null;
});

export const updatePhcSettings = command(
	v.object({
		phcId: v.string(),
		settings: v.object({
			dailyPatientCapacity: v.optional(
				v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(10_000))
			),
			maternalHealthEnabled: v.optional(v.boolean()),
			immunizationEnabled: v.optional(v.boolean()),
			coldChainEnabled: v.optional(v.boolean()),
			aiVoiceEnabled: v.optional(v.boolean()),
			outbreakDetectionEnabled: v.optional(v.boolean()),
			twoWaySmsEnabled: v.optional(v.boolean()),
			referralsEnabled: v.optional(v.boolean()),
			familyHealthEnabled: v.optional(v.boolean()),
			realTimeNotificationsEnabled: v.optional(v.boolean()),
			nhisTrackingEnabled: v.optional(v.boolean())
		})
	}),
	async ({ phcId, settings }) => {
		const locals = requireAuth();
		if (!locals.phcId || locals.phcId !== phcId) error(403, 'PHC scope mismatch');
		if (locals.role !== 'superadmin' && !locals.permissions?.includes('manage:phc')) {
			error(403, 'Missing PHC-management permission');
		}
		await database.update(phcs).set(settings).where(eq(phcs.id, phcId));
		return true;
	}
);
