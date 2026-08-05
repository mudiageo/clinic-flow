import { form, query } from '$app/server';
import * as v from 'valibot';
import fs from 'node:fs/promises';
import path from 'node:path';
import { requireSuperadmin } from '$lib/server/rbac';

const SETTINGS_FILE = path.join(process.cwd(), '.clinicflow_settings.json');

const defaultSettings = {
	betaUpdates: false,
	telemetryEnabled: true,
	strictAuditMode: true,
	emailAlerts: true,
	autoBackup: true
};

export const getAppSettings = query(async () => {
	requireSuperadmin();
	try {
		const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
		return { ...defaultSettings, ...JSON.parse(data) };
	} catch {
		return defaultSettings;
	}
});

export const updateAppSettings = form(
	v.object({
		betaUpdates: v.boolean(),
		telemetryEnabled: v.boolean(),
		strictAuditMode: v.boolean(),
		emailAlerts: v.boolean(),
		autoBackup: v.boolean()
	}),
	async (data) => {
		requireSuperadmin();
		await fs.writeFile(SETTINGS_FILE, JSON.stringify(data, null, 2));
		return { success: true };
	}
);
