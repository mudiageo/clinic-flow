import { db, type LocalAppointment } from '$lib/local-db/db';
import { LocalCollection } from './local-collection.svelte';

class AppointmentStore extends LocalCollection<LocalAppointment> {
	constructor() {
		super(db.appointments, 'appointments', () => db.appointments.toArray());
	}

	get upcoming() {
		const now = Date.now();
		return this.items.filter((a) => a.status === 'scheduled' && a.scheduledAt > now);
	}

	get today() {
		const start = new Date();
		start.setHours(0, 0, 0, 0);
		const end = new Date();
		end.setHours(23, 59, 59, 999);
		return this.items.filter((a) => a.status === 'scheduled' && a.scheduledAt >= start.getTime() && a.scheduledAt <= end.getTime());
	}

	forPatient(patientId: string) {
		return this.items.filter((a) => a.patientId === patientId).sort((a, b) => b.scheduledAt - a.scheduledAt);
	}

	forStaff(staffId: string) {
		return this.items.filter((a) => a.assignedStaffId === staffId).sort((a, b) => b.scheduledAt - a.scheduledAt);
	}

	forDate(date: Date) {
		const start = new Date(date);
		start.setHours(0, 0, 0, 0);
		const end = new Date(date);
		end.setHours(23, 59, 59, 999);
		return this.items.filter((a) => a.scheduledAt >= start.getTime() && a.scheduledAt <= end.getTime());
	}
}

export const appointmentStore = new AppointmentStore();
