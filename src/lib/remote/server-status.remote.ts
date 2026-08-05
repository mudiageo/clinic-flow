import { query, form, command } from '$app/server';
import { getRequestEvent } from '$app/server';
import * as v from 'valibot';
import { randomBytes } from 'node:crypto';
import { getDeviceCountsByPhc, registerPendingDevice } from '$lib/server/db/queries/devices';

// ─────────────────────────────────────────────────────────────
// SERVER STATUS
// ─────────────────────────────────────────────────────────────

export const getServerStatus = query(async () => {
	const event = getRequestEvent();
	if (!event.locals.phcId) return null;

	const uptimeSeconds = process.uptime();
	const memoryMb = Math.round(process.memoryUsage().rss / 1024 / 1024);

	const counts = await getDeviceCountsByPhc(event.locals.phcId);

	return {
		uptimeSeconds,
		memoryMb,
		nodeVersion: process.version,
		activeDevices: counts.activeCount,
		pendingDevices: counts.pendingCount,
		isMasterServer: process.env.DATABASE_URL?.startsWith('file:') || process.env.DATABASE_URL?.startsWith('libsql:') || false
	};
});

// ─────────────────────────────────────────────────────────────
// DEVICE PAIRING TOKEN
// ─────────────────────────────────────────────────────────────

const pairingTokens = new Map<string, { phcId: string; expiresAt: number }>();

/** Generate a new secure pairing token for tablet onboarding */
export const generatePairingToken = query(async () => {
	const event = getRequestEvent();
	if (!event.locals.phcId || !['admin', 'superadmin'].includes(event.locals.role ?? '')) {
		return null;
	}

	const token = randomBytes(16).toString('hex').toUpperCase();
	const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

	pairingTokens.set(token, { phcId: event.locals.phcId, expiresAt });

	setTimeout(() => pairingTokens.delete(token), 5 * 60 * 1000);

	return { token, expiresAt };
});

/** Validate a pairing token when a tablet scans the QR code */
export const validatePairingToken = command(
	v.object({
		token: v.string(),
		deviceName: v.pipe(v.string(), v.minLength(2)),
		role: v.optional(
			v.union([
				v.literal('kiosk'),
				v.literal('triage'),
				v.literal('doctor_tablet'),
				v.literal('pharmacy_terminal')
			]),
			'kiosk'
		)
	}),
	async (data) => {
		const entry = pairingTokens.get(data.token);

		if (!entry || entry.expiresAt < Date.now()) {
			throw new Error('Invalid or expired pairing token');
		}

		const device = await registerPendingDevice({
			phcId: entry.phcId,
			name: data.deviceName,
			role: data.role ?? 'kiosk'
		});

		pairingTokens.delete(data.token);

		return { deviceId: device.id, status: 'pending' };
	}
);
