import { db, type LocalReminder } from '$lib/local-db/db';
import { LocalCollection } from './local-collection.svelte';

class ReminderStore extends LocalCollection<LocalReminder> {
	constructor() {
		super(db.reminders, 'reminders', () => db.reminders.toArray());
	}

	// Helper to get pending scheduled reminders
	get pendingReminders() {
		return this.sortedItems.filter((r) => r.status === 'scheduled');
	}

	get sortedItems() {
		return [...this.items].sort((a, b) => a.dueDate - b.dueDate);
	}
}

export const reminderStore = new ReminderStore();
