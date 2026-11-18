/**
 * Deterministic, idempotent ClinicFlow database seeder.
 *
 * Usage:
 *   pnpm db:seed                       seed all three demo PHCs
 *   pnpm db:seed -- --phc=egor         seed only Egor
 *   pnpm db:seed -- --phc=oredo --reset
 *
 * The data itself lives in `src/lib/seed/fixtures.ts`; this file only writes it
 * to Postgres through the same `toServerRow()` shim used by the sync endpoint.
 * Re-running never duplicates rows: every id is derived from a stable key.
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, inArray, sql } from 'drizzle-orm';
import postgres from 'postgres';
import { hashPassword } from 'better-auth/crypto';
import * as schema from './schema.js';
import {
	buildAllFixtures,
	buildFixtures,
	PHC_PROFILES,
	SEED_DEVICE_ID,
	seedId,
	type FixtureSet
} from '../../seed/fixtures.js';
import { toServerRow } from '../../seed/adapters.js';

// ── CLI arguments ───────────────────────────────────────────────────────────

const args = process.argv.slice(2).filter((a) => a !== '--');
const phcArg = args.find((a) => a.startsWith('--phc='))?.slice('--phc='.length);
const reset = args.includes('--reset');
const forceRemote = args.includes('--force-remote');

if (phcArg && !PHC_PROFILES.some((p) => p.slug === phcArg)) {
	console.error(
		`Unknown PHC "${phcArg}". Available: ${PHC_PROFILES.map((p) => p.slug).join(', ')}`
	);
	process.exit(1);
}

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
	throw new Error('DATABASE_URL is not set. Run with --env-file=.env (pnpm db:seed does this).');
}

// Refuse to write to a non-local database unless explicitly overridden.
if (!forceRemote) {
	let host = 'unknown';
	try {
		host = new URL(dbUrl).hostname;
	} catch {
		// fall through to the guard below
	}
	if (!['localhost', '127.0.0.1', '::1'].includes(host)) {
		throw new Error(
			`Refusing to seed non-local database (host: ${host}). Pass --force-remote only if you are certain.`
		);
	}
}

const client = postgres(dbUrl);
const db = drizzle(client, { schema });

// ── Helpers ─────────────────────────────────────────────────────────────────

type AnyTable = { id: any; [key: string]: any };

/** Bulk upsert keyed by the deterministic id. */
async function upsert(table: AnyTable, rows: Record<string, unknown>[]): Promise<number> {
	if (rows.length === 0) return 0;
	// Use the inserted values for every column. Never put the primary key in SET
	// (each conflicting row would be rewritten to the first row's id), and never
	// build SET from rows[0] alone (batches can have differing optional fields).
	const setValues = Object.fromEntries(
		Object.keys(rows[0])
			.filter((key) => key !== 'id' && table[key] !== undefined)
			.map((key) => [key, sql.raw(`excluded."${table[key].name}"`)])
	);
	await db
		.insert(table)
		.values(rows as any)
		.onConflictDoUpdate({ target: table.id, set: setValues as any });
	return rows.length;
}

/** Ensure a Better Auth user + credential account exist; return the real user id. */
async function ensureAuthUser(input: {
	id: string;
	email: string;
	name: string;
	password: string;
}): Promise<string> {
	const [existing] = await db.select().from(schema.user).where(eq(schema.user.email, input.email));
	if (existing) {
		const [account] = await db
			.select()
			.from(schema.account)
			.where(eq(schema.account.userId, existing.id));
		if (!account) {
			await db.insert(schema.account).values({
				id: seedId(`auth:account:${input.email}`),
				accountId: existing.id,
				providerId: 'credential',
				userId: existing.id,
				password: await hashPassword(input.password)
			});
		}
		return existing.id;
	}

	await db.insert(schema.user).values({
		id: input.id,
		email: input.email,
		name: input.name,
		emailVerified: true
	});
	await db.insert(schema.account).values({
		id: seedId(`auth:account:${input.email}`),
		accountId: input.id,
		providerId: 'credential',
		userId: input.id,
		password: await hashPassword(input.password)
	});
	return input.id;
}

/** Delete only rows that belong to the deterministic fixture catalogue. */
async function resetSeedRows(fixtures: FixtureSet[]) {
	console.log('-> Removing previous fixture rows (--reset)');
	const phcIds = fixtures.map((f) => f.phcId);
	const patientIds = fixtures.flatMap((f) => f.patients.map((p) => p.id));
	const emails = fixtures.flatMap((f) => f.authUsers.map((u) => u.email));

	const byPhc = async (table: AnyTable) => {
		await db.delete(table).where(inArray(table.phcId, phcIds));
	};
	const byId = async (table: AnyTable, ids: string[]) => {
		if (ids.length) await db.delete(table).where(inArray(table.id, ids));
	};

	// Tables that reference patients/encounters rather than PHCs must go first.
	if (patientIds.length) {
		await db
			.delete(schema.prescriptions)
			.where(inArray(schema.prescriptions.patientId, patientIds));
		await db
			.delete(schema.vitalsRecords)
			.where(inArray(schema.vitalsRecords.patientId, patientIds));
		await db
			.delete(schema.familyRelationships)
			.where(inArray(schema.familyRelationships.patientId, patientIds));
	}

	await byPhc(schema.syncOperations);
	await byPhc(schema.labRequests);
	await byPhc(schema.queueTickets);
	await byPhc(schema.restockRequests);
	await byPhc(schema.encounters);
	await byPhc(schema.appointments);
	await byPhc(schema.pregnancyRecords);
	await byPhc(schema.reminders);
	await byPhc(schema.pharmacyInventory);
	await byPhc(schema.devices);
	await byPhc(schema.smsInbox);
	await byPhc(schema.auditLog);
	await byPhc(schema.permissions);
	await byPhc(schema.staff);
	await byPhc(schema.triageRules);
	await byPhc(schema.patients);

	for (const f of fixtures)
		await byId(
			schema.families,
			f.families.map((x) => x.id)
		);
	await byId(schema.phcs, phcIds);

	// Auth accounts are keyed by email, not by PHC.
	const seededUsers = await db.select().from(schema.user).where(inArray(schema.user.email, emails));
	const userIds = seededUsers.map((u) => u.id);
	if (userIds.length) {
		await db.delete(schema.account).where(inArray(schema.account.userId, userIds));
		await db.delete(schema.session).where(inArray(schema.session.userId, userIds));
		await db.delete(schema.user).where(inArray(schema.user.id, userIds));
	}
}

// ── Seed one PHC ────────────────────────────────────────────────────────────

async function seedFixture(f: FixtureSet) {
	const { profile } = f;
	console.log(`\n-> PHC: ${profile.name} (${profile.slug})`);

	let rowsWritten = 0;

	rowsWritten += await upsert(schema.phcs as AnyTable, [
		{
			id: f.phcId,
			name: profile.name,
			lga: profile.lga,
			state: profile.state,
			lgaDsoPhone: profile.lgaDsoPhone,
			dailyPatientCapacity: profile.dailyPatientCapacity,
			...profile.flags
		}
	]);

	const userIds = new Map<string, string>();
	for (const user of f.authUsers) userIds.set(user.email, await ensureAuthUser(user));

	rowsWritten += await upsert(
		schema.staff as AnyTable,
		f.staff.map((s) => {
			const owner = f.authUsers.find((u) => u.id === s.authUserId);
			return {
				...(toServerRow('staff', s as unknown as Record<string, unknown>) as Record<
					string,
					unknown
				>),
				authUserId: (owner && userIds.get(owner.email)) || s.authUserId
			};
		})
	);

	rowsWritten += await upsert(
		schema.families as AnyTable,
		f.families.map((x) => ({
			id: x.id,
			phcId: x.phcId,
			householdName: x.householdName,
			community: x.community
		}))
	);

	const write = async (entityType: string, rows: Array<{ id: string }>) => {
		const serverRows = rows.map(
			(r) =>
				toServerRow(entityType, r as unknown as Record<string, unknown>) as Record<string, unknown>
		);
		rowsWritten += await upsert(schema[entityType as keyof typeof schema] as AnyTable, serverRows);
	};

	await write('patients', f.patients);
	await write('encounters', f.encounters);
	await write('vitalsRecords', f.vitalsRecords);
	await write('queueTickets', f.queueTickets);
	await write('pharmacyInventory', f.pharmacyInventory);
	await write('prescriptions', f.prescriptions);
	await write('labRequests', f.labRequests);
	await write('restockRequests', f.restockRequests);
	await write('reminders', f.reminders);
	await write('appointments', f.appointments);
	await write('pregnancyRecords', f.pregnancyRecords);
	await write('triageRules', f.triageRules);

	rowsWritten += await upsert(schema.devices as AnyTable, f.serverOnly.devices);
	rowsWritten += await upsert(schema.smsInbox as AnyTable, f.serverOnly.smsInbox);
	rowsWritten += await upsert(schema.auditLog as AnyTable, f.serverOnly.auditLog);

	// Sync log: client-shaped payloads so a fresh Dexie can pull this data.
	const syncRows: Array<Record<string, unknown>> = [];
	const log = (entityType: string, rows: Array<{ id: string; updatedAt: number }>) => {
		for (const row of rows) {
			syncRows.push({
				id: seedId(`syncop:${profile.slug}:${entityType}:${row.id}`),
				phcId: f.phcId,
				deviceId: SEED_DEVICE_ID,
				entityType,
				entityId: row.id,
				operation: 'create',
				payload: JSON.stringify(row),
				clientUpdatedAt: new Date(row.updatedAt)
			});
		}
	};
	log('patients', f.patients);
	log('staff', f.staff);
	log('families', f.families);
	log('encounters', f.encounters);
	log('vitalsRecords', f.vitalsRecords);
	log('queueTickets', f.queueTickets);
	log('pharmacyInventory', f.pharmacyInventory);
	log('prescriptions', f.prescriptions);
	log('labRequests', f.labRequests);
	log('restockRequests', f.restockRequests);
	log('reminders', f.reminders);
	log('appointments', f.appointments);
	log('pregnancyRecords', f.pregnancyRecords);
	log('triageRules', f.triageRules);

	await db
		.insert(schema.syncOperations)
		.values(syncRows as any)
		.onConflictDoNothing();

	console.log(
		`   ${f.patients.length} patients, ${f.encounters.length} encounters, ` +
			`${f.queueTickets.length} queue tickets, ${f.pharmacyInventory.length} stock items`
	);
	console.log(`   ~${rowsWritten} rows upserted, ${syncRows.length} sync operations published`);
}

// ── Main ────────────────────────────────────────────────────────────────────

async function seed() {
	console.log('🌱 Seeding ClinicFlow from the shared fixture catalogue…');

	const fixtures = phcArg
		? [buildFixtures(PHC_PROFILES.find((p) => p.slug === phcArg)!)]
		: buildAllFixtures();

	if (reset) await resetSeedRows(fixtures);
	for (const f of fixtures) await seedFixture(f);

	console.log('\n✅ Seeding complete. Demo logins use password "password123".');
}

seed()
	.then(async () => {
		await client.end();
		process.exit(0);
	})
	.catch(async (err) => {
		console.error('Error seeding DB:', err);
		await client.end();
		process.exit(1);
	});
