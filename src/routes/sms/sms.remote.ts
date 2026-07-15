import { command } from '$app/server';
import * as v from 'valibot';

export const dispatchReminders = command(
	v.array(
		v.object({
			id: v.string(),
			phone: v.string(),
			message: v.string()
		})
	),
	async (batch) => {
		// Stub implementation for Termii/Africa's Talking Sandbox
		const results = [];
		for (const r of batch) {
			console.log(`[SMS Worker] Dispatching to ${r.phone}: "${r.message}"`);
			// Simulate network delay to remote SMS API
			await new Promise((resolve) => setTimeout(resolve, 500));

			results.push({
				id: r.id,
				success: true,
				providerMessageId: `termii_sandbox_${crypto.randomUUID()}`
			});
		}
		return results;
	}
);
