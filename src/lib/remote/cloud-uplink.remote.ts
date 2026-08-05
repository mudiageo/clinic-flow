import { query, form } from '$app/server';
import { getRequestEvent } from '$app/server';
import { db } from '$lib/server/db';
import * as v from 'valibot';
import { hashPassword } from 'better-auth/crypto';
import { upsertUplinkConfig, deleteUplinkConfig } from '$lib/server/db/queries/uplink';

// ─────────────────────────────────────────────────────────────
// GET UPLINK CONFIG
// ─────────────────────────────────────────────────────────────

export const getUplinkConfig = query(async () => {
	const event = getRequestEvent();
	if (!event.locals.phcId) return null;

	const config = await db.query.uplinkConfig?.findFirst({
		where: (t, { eq }) => eq(t.phcId, event.locals.phcId!)
	});

	if (!config) return null;

	// Never expose the raw key or password hash to the client
	return {
		cloudUrl: config.cloudUrl,
		superAdminEmail: config.superAdminEmail,
		lastSyncAt: config.lastSyncAt,
		syncEnabled: config.syncEnabled,
		isConfigured: true
	};
});

// ─────────────────────────────────────────────────────────────
// SAVE UPLINK CONFIG + TEST CONNECTION + MIRROR SUPERADMIN
// ─────────────────────────────────────────────────────────────

export const saveUplinkConfig = form(
	v.object({
		/** The full Uplink Key pasted from the ClinicFlow cloud dashboard.
		 *  Format: base64( JSON({ cloudUrl, apiKey, superAdminEmail }) )
		 */
		uplinkKeyBase64: v.pipe(v.string(), v.minLength(10, 'Invalid uplink key')),
		/** SuperAdmin password — used ONCE to derive the offline hash.
		 *  Never stored in plaintext. */
		superAdminPassword: v.pipe(v.string(), v.minLength(8, 'Password must be at least 8 characters'))
	}),
	async ({ uplinkKeyBase64, superAdminPassword }) => {
		const event = getRequestEvent();
		if (!event.locals.phcId) throw new Error('Unauthorized');
		if (!['admin', 'superadmin'].includes(event.locals.role ?? '')) throw new Error('Unauthorized');

		// 1. Decode and validate the uplink key
		let decoded: { cloudUrl: string; apiKey: string; superAdminEmail: string };
		try {
			decoded = JSON.parse(Buffer.from(uplinkKeyBase64, 'base64').toString('utf-8'));
			if (!decoded.cloudUrl || !decoded.apiKey || !decoded.superAdminEmail) {
				throw new Error('Missing fields');
			}
		} catch {
			throw new Error('Invalid uplink key format. Please copy it again from the cloud dashboard.');
		}

		// 2. Test the connection by pinging the cloud health endpoint
		const testRes = await fetch(`${decoded.cloudUrl}/api/uplink/health`, {
			headers: { Authorization: `Bearer ${decoded.apiKey}` },
			signal: AbortSignal.timeout(8000)
		}).catch(() => null);

		if (!testRes?.ok) {
			throw new Error(
				'Could not connect to the cloud server. Check your internet connection and try again.'
			);
		}

		// 3. Hash the SuperAdmin password for offline login
		const passwordHash = await hashPassword(superAdminPassword);

		// 4. Upsert the uplink config via DAL
		await upsertUplinkConfig(event.locals.phcId, {
			cloudUrl: decoded.cloudUrl,
			apiKey: decoded.apiKey,
			superAdminEmail: decoded.superAdminEmail,
			superAdminPasswordHash: passwordHash
		});

		return {
			success: true,
			cloudUrl: decoded.cloudUrl,
			superAdminEmail: decoded.superAdminEmail
		};
	}
);

// ─────────────────────────────────────────────────────────────
// TEST UPLINK CONNECTION (read-only ping)
// ─────────────────────────────────────────────────────────────

export const testUplinkConnection = query(async () => {
	const event = getRequestEvent();
	if (!event.locals.phcId) return { connected: false };

	const config = await db.query.uplinkConfig?.findFirst({
		where: (t, { eq }) => eq(t.phcId, event.locals.phcId!)
	});

	if (!config) return { connected: false, reason: 'Not configured' };

	try {
		const res = await fetch(`${config.cloudUrl}/api/uplink/health`, {
			headers: { Authorization: `Bearer ${config.uplinkKey}` },
			signal: AbortSignal.timeout(5000)
		});
		return { connected: res.ok, latencyMs: null };
	} catch {
		return { connected: false, reason: 'Unreachable' };
	}
});

// ─────────────────────────────────────────────────────────────
// DISABLE / REMOVE UPLINK
// ─────────────────────────────────────────────────────────────

export const removeUplinkConfig = form(v.null_(), async () => {
	const event = getRequestEvent();
	if (!event.locals.phcId) throw new Error('Unauthorized');
	await deleteUplinkConfig(event.locals.phcId);
	return { success: true };
});
